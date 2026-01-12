import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from './_core/trpc';
import { getDb, getGameState, getActivePlayers, createTransaction, getTransactionHistory, getGameRoundHistory } from './db';
import { addToQueue, getQueueLength, peekQueue } from './queue';
import { users, activePlayers, gameState, gameRounds } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';

const ENTRY_AMOUNTS = [5, 10, 15, 20]; // Montos permitidos en Reales
const MAX_ACTIVE_PLAYERS = 10;

/**
 * Calcula el premio basado en el monto de entrada y el pozo
 * - Entrada 5 Reales: puede ganar hasta 15 Reales (3x)
 * - Entrada 10 Reales: puede ganar hasta 30 Reales (3x)
 * - Entrada 15 Reales: puede ganar hasta 45 Reales (3x)
 * - Entrada 20 Reales: puede ganar hasta 60 Reales (3x)
 * Pero el premio es un porcentaje del pozo total
 */
function calculatePrize(entryAmount: number, pot: number): number {
  const maxMultiplier = 3;
  const maxPossiblePrize = entryAmount * maxMultiplier;
  
  // El premio es el mínimo entre:
  // 1. El máximo posible basado en la entrada (3x)
  // 2. Un porcentaje del pozo (30% para mantener el juego sostenible)
  const potPercentage = Math.floor(pot * 0.3);
  
  return Math.min(maxPossiblePrize, potPercentage);
}

export const gameRouter = router({
  /**
   * Obtiene el estado actual del juego
   */
  getState: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const state = await getGameState();
    const activePlayersData = await getActivePlayers();
    const queueLength = await getQueueLength();

    return {
      gameState: state,
      activePlayers: activePlayersData,
      queueLength,
      maxActivePlayers: MAX_ACTIVE_PLAYERS,
    };
  }),

  /**
   * Obtiene el saldo actual del usuario autenticado
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return user[0]?.balance || 0;
  }),

  /**
   * Realiza un depósito en la cuenta del usuario
   */
  deposit: protectedProcedure
    .input(z.object({ amount: z.number().min(1).max(10000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user[0]) throw new Error('User not found');

      const newBalance = await createTransaction(
        ctx.user.id,
        'deposit',
        input.amount,
        user[0].balance,
        `Depósito de R$ ${input.amount}`
      );

      await db.update(users).set({ balance: newBalance }).where(eq(users.id, ctx.user.id));

      return { newBalance };
    }),

  /**
   * Permite al usuario unirse a la cola de espera
   */
  joinQueue: protectedProcedure
    .input(z.object({ entryAmount: z.enum(['5', '10', '15', '20']) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const entryAmount = parseInt(input.entryAmount);
      if (!ENTRY_AMOUNTS.includes(entryAmount)) {
        throw new Error('Invalid entry amount');
      }

      // Obtener usuario actual
      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user[0]) throw new Error('User not found');

      // Validar saldo
      if (user[0].balance < entryAmount) {
        throw new Error('Insufficient balance');
      }

      // Validar que no esté ya en la cola o jugando
      if (user[0].status !== 'inactive') {
        throw new Error('Already in queue or playing');
      }

      // Restar dinero del usuario
      const newBalance = await createTransaction(
        ctx.user.id,
        'entry_fee',
        entryAmount,
        user[0].balance,
        `Cuota de entrada a la ruleta: R$ ${entryAmount}`
      );

      // Actualizar usuario
      await db.update(users)
        .set({ balance: newBalance, status: 'waiting' })
        .where(eq(users.id, ctx.user.id));

      // Obtener estado del juego
      const state = await getGameState();
      if (!state) throw new Error('Game state not found');

      // Añadir al pozo
      await db.update(gameState)
        .set({ pot: state.pot + entryAmount })
        .where(eq(gameState.id, state.id));

      // Añadir a la cola
      await addToQueue(ctx.user.id, entryAmount);

      return {
        success: true,
        newBalance,
        message: `Unido a la cola. Entrada: R$ ${entryAmount}`,
      };
    }),

  /**
   * Obtiene la cola de espera (primeros 10)
   */
  getQueue: publicProcedure.query(async () => {
    const queueJobs = await peekQueue(10);
    const db = await getDb();
    if (!db) return [];

    // Obtener información de los usuarios en la cola
    const queueWithUsers = await Promise.all(
      queueJobs.map(async (job) => {
        const user = await db.select().from(users).where(eq(users.id, job.userId)).limit(1);
        return {
          ...job,
          userName: user[0]?.name || 'Unknown',
        };
      })
    );

    return queueWithUsers;
  }),

  /**
   * Obtiene el historial de transacciones del usuario
   */
  getTransactionHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return await getTransactionHistory(ctx.user.id, input.limit);
    }),

  /**
   * Obtiene el historial de rondas completadas
   */
  getGameRoundHistory: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getGameRoundHistory(input.limit);
    }),

  /**
   * Obtiene las estadísticas del usuario
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user[0]) throw new Error('User not found');

    return {
      balance: user[0].balance,
      gamesPlayed: user[0].gamesPlayed,
      totalWinnings: user[0].totalWinnings,
      status: user[0].status,
    };
  }),
});
