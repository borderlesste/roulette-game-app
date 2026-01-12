import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { processGameRound, tryAddPlayerFromQueue, getActivePlayersWithDetails, getNextQueuePreview } from './gameEngine';
import { gameState, activePlayers } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const gameControlRouter = router({
  /**
   * Inicia un giro de ruleta (solo si hay al menos 2 jugadores)
   */
  spin: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Obtener estado del juego
    const state = await db.select().from(gameState).limit(1);
    if (!state[0]) throw new Error('Game state not found');

    // Verificar que hay suficientes jugadores
    const players = await db.select().from(activePlayers);
    if (players.length < 2) {
      throw new Error('Se necesitan al menos 2 jugadores para girar');
    }

    // Actualizar estado a SPINNING
    await db.update(gameState)
      .set({ status: 'SPINNING' })
      .where(eq(gameState.id, state[0].id));

    return {
      success: true,
      message: 'Ruleta girando...',
      playersCount: players.length,
    };
  }),

  /**
   * Procesa el resultado del giro (llamado después de que la animación termina)
   */
  finishSpin: protectedProcedure.mutation(async () => {
    const result = await processGameRound();
    return result;
  }),

  /**
   * Obtiene los jugadores activos con detalles
   */
  getActivePlayers: publicProcedure.query(async () => {
    return await getActivePlayersWithDetails();
  }),

  /**
   * Obtiene una vista previa del siguiente en la cola
   */
  getNextQueuePreview: publicProcedure.query(async () => {
    return await getNextQueuePreview();
  }),

  /**
   * Obtiene el estado actual del juego con todos los detalles
   */
  getFullGameState: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const state = await db.select().from(gameState).limit(1);
    if (!state[0]) throw new Error('Game state not found');

    const activePlayers = await getActivePlayersWithDetails();
    const nextInQueue = await getNextQueuePreview();

    return {
      gameState: state[0],
      activePlayers,
      nextInQueue,
      activePlayersCount: activePlayers.length,
    };
  }),

  /**
   * Intenta añadir un jugador de la cola a los activos
   * (útil para llenar espacios cuando alguien gana)
   */
  tryAddFromQueue: publicProcedure.mutation(async () => {
    const newPlayer = await tryAddPlayerFromQueue();
    return {
      success: !!newPlayer,
      newPlayer,
    };
  }),
});
