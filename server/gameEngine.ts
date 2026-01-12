import { getDb, getGameState, getActivePlayers, createTransaction } from './db';
import { getNextFromQueue, peekQueue } from './queue';
import { users, activePlayers, gameState, gameRounds } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const MAX_ACTIVE_PLAYERS = 10;

/**
 * Calcula el premio basado en el monto de entrada y el pozo
 */
export function calculatePrize(entryAmount: number, pot: number): number {
  const maxMultiplier = 3;
  const maxPossiblePrize = entryAmount * maxMultiplier;
  const potPercentage = Math.floor(pot * 0.3);
  return Math.min(maxPossiblePrize, potPercentage);
}

/**
 * Selecciona un ganador aleatorio de los jugadores activos
 */
export async function selectRandomWinner() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const players = await db.select().from(activePlayers);
  if (players.length === 0) throw new Error('No active players');

  const randomIndex = Math.floor(Math.random() * players.length);
  return players[randomIndex];
}

/**
 * Procesa una ronda completa del juego:
 * 1. Selecciona un ganador aleatorio
 * 2. Calcula el premio
 * 3. Transfiere el premio al ganador
 * 4. Registra la ronda en el historial
 * 5. Remueve al ganador de los jugadores activos
 * 6. Añade el siguiente de la cola (si hay)
 */
export async function processGameRound() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Obtener estado del juego
  const state = await getGameState();
  if (!state) throw new Error('Game state not found');

  // Seleccionar ganador
  const winner = await selectRandomWinner();
  if (!winner) throw new Error('No winner selected');

  // Obtener información del ganador
  const winnerUser = await db.select().from(users).where(eq(users.id, winner.userId)).limit(1);
  if (!winnerUser[0]) throw new Error('Winner user not found');

  // Calcular premio
  const prize = calculatePrize(winner.entryAmount, state.pot);

  // Crear transacción de premio
  const newBalance = await createTransaction(
    winner.userId,
    'prize_won',
    prize,
    winnerUser[0].balance,
    `¡Ganaste en la ruleta! Premio: R$ ${prize}`
  );

  // Actualizar usuario ganador
  await db.update(users)
    .set({
      balance: newBalance,
      status: 'inactive',
      gamesPlayed: winnerUser[0].gamesPlayed + 1,
      totalWinnings: winnerUser[0].totalWinnings + prize,
    })
    .where(eq(users.id, winner.userId));

  // Registrar la ronda en el historial
  await db.insert(gameRounds).values({
    winnerId: winner.userId,
    winnerEntryAmount: winner.entryAmount,
    prizeAmount: prize,
    potAtTime: state.pot,
  });

  // Remover ganador de jugadores activos
  await db.delete(activePlayers).where(eq(activePlayers.id, winner.id));

  // Actualizar pozo (restar el premio pagado)
  const newPot = Math.max(0, state.pot - prize);

  // Obtener siguiente de la cola
  const nextInQueue = await getNextFromQueue();
  
  if (nextInQueue) {
    // Hay jugador en la cola, añadirlo a jugadores activos
    const nextUser = await db.select().from(users).where(eq(users.id, nextInQueue.userId)).limit(1);
    if (nextUser[0]) {
      // Obtener posición disponible
      const currentPlayers = await db.select().from(activePlayers);
      const nextPosition = currentPlayers.length;

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

      // Actualizar pozo (añadir entrada del nuevo jugador)
      const updatedPot = newPot + nextInQueue.entryAmount;

      // Actualizar estado del juego
      const newStatus = currentPlayers.length < MAX_ACTIVE_PLAYERS - 1 ? 'READY_TO_SPIN' : 'READY_TO_SPIN';
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
          prize,
        },
        newPlayer: {
          id: nextInQueue.userId,
          name: nextUser[0].name,
          entryAmount: nextInQueue.entryAmount,
        },
        newPot: updatedPot,
      };
    }
  }

  // No hay jugador en cola, solo actualizar estado
  const currentPlayers = await db.select().from(activePlayers);
  const newStatus = currentPlayers.length >= MAX_ACTIVE_PLAYERS ? 'READY_TO_SPIN' : 'WAITING_FOR_PLAYERS';

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
      prize,
    },
    newPlayer: null,
    newPot,
  };
}

/**
 * Intenta añadir un jugador de la cola a los jugadores activos
 * Se llama cuando hay un espacio disponible
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

  const nextUser = await db.select().from(users).where(eq(users.id, nextInQueue.userId)).limit(1);
  if (!nextUser[0]) throw new Error('User not found');

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

  // Actualizar pozo
  const state = await getGameState();
  if (state) {
    const updatedPot = state.pot + nextInQueue.entryAmount;
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
  };
}

/**
 * Obtiene el estado actual de los jugadores activos
 */
export async function getActivePlayersWithDetails() {
  const db = await getDb();
  if (!db) return [];

  const players = await db.select().from(activePlayers);
  const playersWithDetails = await Promise.all(
    players.map(async (player) => {
      const user = await db.select().from(users).where(eq(users.id, player.userId)).limit(1);
      return {
        ...player,
        userName: user[0]?.name || 'Unknown',
        userEmail: user[0]?.email,
      };
    })
  );

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
