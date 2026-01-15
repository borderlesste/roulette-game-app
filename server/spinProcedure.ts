import { TRPCError } from '@trpc/server';
import { protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { processGameRound, getActivePlayersWithDetails } from './gameEngine';
import { z } from 'zod';
import { activePlayers } from '../drizzle/schema';

/**
 * Procedimiento para iniciar un giro de ruleta
 * Valida que haya al menos 2 jugadores activos
 */
export const spinProcedure = protectedProcedure
  .mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      // Obtener jugadores activos
      const players = await db.select().from(activePlayers);
      if (players.length < 2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Se necesitan al menos 2 jugadores para girar la ruleta',
        });
      }

      // Procesar la ronda (seleccionar ganador, calcular premio, etc.)
      const result = await processGameRound();

      return {
        success: true,
        winnerId: result.winner.id,
        winnerName: result.winner.name,
        prize: result.winner.prize,
        newPot: result.newPot,
        newPlayer: result.newPlayer,
      };
    } catch (error) {
      console.error('[Spin] Error during spin:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Error processing spin',
      });
    }
  });

/**
 * Procedimiento para obtener el estado actual de la ruleta
 */
export const getSpinStateProcedure = protectedProcedure
  .query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const activePlayers_ = await db.select().from(activePlayers);

      return {
        status: activePlayers_.length >= 2 ? 'READY_TO_SPIN' : 'WAITING_FOR_PLAYERS',
        activePlayers: activePlayers_.length,
        canSpin: activePlayers_.length >= 2,
      };
    } catch (error) {
      console.error('[GetSpinState] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting spin state',
      });
    }
  });

/**
 * Procedimiento para obtener el historial de rondas
 */
export const getGameRoundsHistoryProcedure = protectedProcedure
  .input(z.object({
    limit: z.number().default(10),
    offset: z.number().default(0),
  }))
  .query(async ({ ctx, input }) => {
    return {
      rounds: [],
      total: 0,
      limit: input.limit,
      offset: input.offset,
    };
  });
