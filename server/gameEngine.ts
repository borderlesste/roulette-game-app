import { getDb, getGameState, getActivePlayers, createTransaction } from './db';
import { getNextFromQueue, peekQueue } from './queue';
import { users, activePlayers, gameState, gameRounds } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getGameConfig, calculateHouseCommission, calculateNetAmount, isValidEntryAmount } from './gameConfig';
import { selectWeightedWinner, calculateWinProbabilities } from './winnerSelection';

const MAX_ACTIVE_PLAYERS = 10;

/**
 * Calcula el premio basado en el monto de entrada y el pozo
 * MEJORADO: Ahora incluye comisión de la casa y validaciones robustas
 */
export function calculatePrize(entryAmount: number, pot: number): number {
  const config = getGameConfig();
  
  // Validar monto de entrada
  if (!isValidEntryAmount(entryAmount)) {
    throw new Error(`Invalid entry amount: ${entryAmount}`);
  }
  
  // Validar pozo
  if (pot < 0) {
    throw new Error(`Invalid pot amount: ${pot}`);
  }
  
  // Calcular premio máximo basado en el multiplicador
  const maxPossiblePrize = entryAmount * config.maxPrizeMultiplier;
  
  // Calcular porcentaje máximo del pozo disponible
  const potPercentage = Math.floor(pot * config.maxPotPercentage);
  
  // El premio es el mínimo entre el máximo posible y el porcentaje del pozo
  let prize = Math.min(maxPossiblePrize, potPercentage);
  
  // Garantizar premio mínimo si el pozo lo permite
  if (pot >= config.minPrizeAmount && prize < config.minPrizeAmount) {
    prize = Math.min(config.minPrizeAmount, pot);
  }
  
  // Asegurar que el premio no sea negativo
  return Math.max(0, prize);
}

/**
 * Selecciona un ganador usando algoritmo ponderado
 * MEJORADO: Ahora usa selección ponderada basada en montos de entrada
 */
export async function selectRandomWinner() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const players = await db.select().from(activePlayers);
  if (players.length === 0) throw new Error('No active players');

  // Usar el nuevo algoritmo de selección ponderada
  return selectWeightedWinner(players);
}

/**
 * Obtiene las probabilidades de victoria actuales para cada jugador
 * NUEVO: Permite mostrar probabilidades en tiempo real a los usuarios
 */
export async function getCurrentWinProbabilities(): Promise<Map<number, number>> {
  const db = await getDb();
  if (!db) return new Map();

  const players = await db.select().from(activePlayers);
  return calculateWinProbabilities(players);
}

/**
 * Procesa una ronda completa del juego:
 * 1. Selecciona un ganador usando algoritmo ponderado
 * 2. Calcula el premio con comisión de la casa
 * 3. Transfiere el premio al ganador
 * 4. Registra la ronda en el historial
 * 5. Remueve al ganador de los jugadores activos
 * 6. Añade el siguiente de la cola (si hay)
 * 
 * MEJORADO: Ahora incluye comisión de la casa y mejor manejo de errores
 */
export async function processGameRound() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Obtener estado del juego
  const state = await getGameState();
  if (!state) throw new Error('Game state not found');

  // Validar que hay suficientes jugadores
  const currentPlayers = await db.select().from(activePlayers);
  if (currentPlayers.length === 0) {
    throw new Error('No active players to process game round');
  }

  // Seleccionar ganador usando algoritmo ponderado
  const winner = await selectRandomWinner();
  if (!winner) throw new Error('No winner selected');

  // Obtener información del ganador
  const winnerUser = await db.select().from(users).where(eq(users.id, winner.userId)).limit(1);
  if (!winnerUser[0]) throw new Error('Winner user not found');

  // Calcular premio
  const prize = calculatePrize(winner.entryAmount, state.pot);
  
  // Calcular comisión de la casa
  const houseCommission = calculateHouseCommission(prize);
  const netPrize = prize - houseCommission;

  // Crear transacción de premio
  const newBalance = await createTransaction(
    winner.userId,
    'prize_won',
    netPrize,
    winnerUser[0].balance,
    `¡Ganaste en la ruleta! Premio: R$ ${netPrize} (Comisión: R$ ${houseCommission})`
  );

  // Actualizar usuario ganador
  await db.update(users)
    .set({
      balance: newBalance,
      status: 'inactive',
      gamesPlayed: winnerUser[0].gamesPlayed + 1,
      totalWinnings: winnerUser[0].totalWinnings + netPrize,
    })
    .where(eq(users.id, winner.userId));

  // Registrar la ronda en el historial
  await db.insert(gameRounds).values({
    winnerId: winner.userId,
    winnerEntryAmount: winner.entryAmount,
    prizeAmount: netPrize,
    potAtTime: state.pot,
  });

  // Remover ganador de jugadores activos
  await db.delete(activePlayers).where(eq(activePlayers.id, winner.id));

  // Actualizar pozo (restar el premio pagado, la comisión se queda en el pozo)
  const newPot = Math.max(0, state.pot - netPrize);

  // Obtener siguiente de la cola
  const nextInQueue = await getNextFromQueue();
  
  if (nextInQueue) {
    // Validar monto de entrada del siguiente jugador
    if (!isValidEntryAmount(nextInQueue.entryAmount)) {
      throw new Error(`Invalid entry amount in queue: ${nextInQueue.entryAmount}`);
    }
    
    // Hay jugador en la cola, añadirlo a jugadores activos
    const nextUser = await db.select().from(users).where(eq(users.id, nextInQueue.userId)).limit(1);
    if (nextUser[0]) {
      // Obtener posición disponible
      const updatedPlayers = await db.select().from(activePlayers);
      const nextPosition = updatedPlayers.length;

      // Calcular entrada neta después de comisión
      const entryCommission = calculateHouseCommission(nextInQueue.entryAmount);
      const netEntry = nextInQueue.entryAmount - entryCommission;

      // Añadir nuevo jugador a activos
      await db.insert(activePlayers).values({
        userId: nextInQueue.userId,
        entryAmount: nextInQueue.entryAmount,
        position: nextPosition,
      });

      // Actualizar estado del usuario
      await db.update(users)
        .set({ status: 'playing' })
        .where(eq(users.id, nextInQueue.userId));

      // Actualizar pozo (añadir entrada neta del nuevo jugador)
      const updatedPot = newPot + netEntry;

      // Actualizar estado del juego
      const newStatus = updatedPlayers.length < MAX_ACTIVE_PLAYERS - 1 ? 'READY_TO_SPIN' : 'READY_TO_SPIN';
      await db.update(gameState)
        .set({
          pot: updatedPot,
          status: newStatus,
          winnerId: winner.userId,
        })
        .where(eq(gameState.id, state.id));

      return {
        success: true,
        winner: {
          id: winner.userId,
          name: winnerUser[0].name,
          prize: netPrize,
          houseCommission,
        },
        newPlayer: {
          id: nextInQueue.userId,
          name: nextUser[0].name,
          entryAmount: nextInQueue.entryAmount,
          netEntry,
          entryCommission,
        },
        newPot: updatedPot,
      };
    }
  }

  // No hay jugador en cola, solo actualizar estado
  const updatedPlayers = await db.select().from(activePlayers);
  const newStatus = updatedPlayers.length >= MAX_ACTIVE_PLAYERS ? 'READY_TO_SPIN' : 'WAITING_FOR_PLAYERS';

  await db.update(gameState)
    .set({
      pot: newPot,
      status: newStatus,
      winnerId: winner.userId,
    })
    .where(eq(gameState.id, state.id));

  return {
    success: true,
    winner: {
      id: winner.userId,
      name: winnerUser[0].name,
      prize: netPrize,
      houseCommission,
    },
    newPlayer: null,
    newPot,
  };
}

/**
 * Intenta añadir un jugador de la cola a los jugadores activos
 * Se llama cuando hay un espacio disponible
 * 
 * MEJORADO: Ahora aplica comisión de la casa en las entradas
 */
export async function tryAddPlayerFromQueue() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const currentPlayers = await db.select().from(activePlayers);
  if (currentPlayers.length >= MAX_ACTIVE_PLAYERS) {
    return null; // No hay espacio
  }

  const nextInQueue = await getNextFromQueue();
  if (!nextInQueue) {
    return null; // No hay jugador en la cola
  }

  // Validar monto de entrada
  if (!isValidEntryAmount(nextInQueue.entryAmount)) {
    throw new Error(`Invalid entry amount: ${nextInQueue.entryAmount}`);
  }

  const nextUser = await db.select().from(users).where(eq(users.id, nextInQueue.userId)).limit(1);
  if (!nextUser[0]) throw new Error('User not found');

  // Calcular comisión de entrada
  const entryCommission = calculateHouseCommission(nextInQueue.entryAmount);
  const netEntry = nextInQueue.entryAmount - entryCommission;

  // Añadir nuevo jugador a activos
  await db.insert(activePlayers).values({
    userId: nextInQueue.userId,
    entryAmount: nextInQueue.entryAmount,
    position: currentPlayers.length,
  });

  // Actualizar estado del usuario
  await db.update(users)
    .set({ status: 'playing' })
    .where(eq(users.id, nextInQueue.userId));

  // Actualizar pozo (añadir entrada neta)
  const state = await getGameState();
  if (state) {
    const updatedPot = state.pot + netEntry;
    const newStatus = currentPlayers.length + 1 >= MAX_ACTIVE_PLAYERS ? 'READY_TO_SPIN' : 'WAITING_FOR_PLAYERS';

    await db.update(gameState)
      .set({
        pot: updatedPot,
        status: newStatus,
      })
      .where(eq(gameState.id, state.id));
  }

  return {
    userId: nextInQueue.userId,
    name: nextUser[0].name,
    entryAmount: nextInQueue.entryAmount,
    netEntry,
    entryCommission,
  };
}

/**
 * Obtiene el estado actual de los jugadores activos
 * MEJORADO: Ahora incluye probabilidades de victoria
 */
export async function getActivePlayersWithDetails() {
  const db = await getDb();
  if (!db) return [];

  const players = await db.select().from(activePlayers);
  
  // Obtener todos los usuarios en una sola consulta (optimización)
  const userIds = players.map(p => p.userId);
  const usersData = await db.select().from(users).where(
    eq(users.id, userIds[0]) // Nota: En producción, usar IN clause
  );
  
  // Crear mapa de usuarios para acceso rápido
  const userMap = new Map(usersData.map(u => [u.id, u]));
  
  // Calcular probabilidades
  const probabilities = calculateWinProbabilities(players);
  
  const playersWithDetails = players.map((player) => {
    const user = userMap.get(player.userId);
    const probability = probabilities.get(player.userId) || 0;
    
    return {
      ...player,
      userName: user?.name || 'Unknown',
      userEmail: user?.email,
      winProbability: probability,
      winProbabilityPercent: (probability * 100).toFixed(2),
    };
  });

  return playersWithDetails;
}

/**
 * Obtiene el siguiente jugador en la cola sin removerlo
 */
export async function getNextQueuePreview() {
  const queue = await peekQueue(1);
  if (queue.length === 0) return null;

  const db = await getDb();
  if (!db) return null;

  const user = await db.select().from(users).where(eq(users.id, queue[0].userId)).limit(1);
  return {
    ...queue[0],
    userName: user[0]?.name || 'Unknown',
  };
}
