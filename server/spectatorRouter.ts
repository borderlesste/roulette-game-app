import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { spectators, spectatorMessages, users } from '../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Registrar espectador conectado
 */
const registerSpectator = protectedProcedure
  .input(z.object({
    socketId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      await db.insert(spectators).values({
        userId: ctx.user!.id,
        socketId: input.socketId,
        connectedAt: new Date(),
      });

      return {
        success: true,
        message: 'Spectator registered successfully',
      };
    } catch (error) {
      console.error('[RegisterSpectator] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error registering spectator',
      });
    }
  });

/**
 * Desregistrar espectador
 */
const unregisterSpectator = protectedProcedure
  .input(z.object({
    socketId: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      await db
        .update(spectators)
        .set({ disconnectedAt: new Date() })
        .where(eq(spectators.socketId, input.socketId));

      return {
        success: true,
        message: 'Spectator unregistered successfully',
      };
    } catch (error) {
      console.error('[UnregisterSpectator] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error unregistering spectator',
      });
    }
  });

/**
 * Obtener lista de espectadores conectados
 */
const getConnectedSpectators = protectedProcedure
  .query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const connectedSpectators = await db
        .select({
          id: spectators.id,
          userId: spectators.userId,
          userName: users.name,
          connectedAt: spectators.connectedAt,
        })
        .from(spectators)
        .innerJoin(users, eq(spectators.userId, users.id));

      return {
        spectators: connectedSpectators,
        count: connectedSpectators.length,
      };
    } catch (error) {
      console.error('[GetConnectedSpectators] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting connected spectators',
      });
    }
  });

/**
 * Enviar mensaje en el chat de espectadores
 */
const sendSpectatorMessage = protectedProcedure
  .input(z.object({
    message: z.string().min(1).max(500),
  }))
  .mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const result = await db.insert(spectatorMessages).values({
        userId: ctx.user!.id,
        message: input.message,
        createdAt: new Date(),
      });

      // Obtener el usuario para retornar su nombre
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .limit(1);

      return {
        success: true,
        message: {
          userId: ctx.user!.id,
          userName: user[0]?.name || 'Anonymous',
          text: input.message,
          createdAt: new Date(),
        },
      };
    } catch (error) {
      console.error('[SendSpectatorMessage] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error sending message',
      });
    }
  });

/**
 * Obtener últimos mensajes del chat
 */
const getSpectatorMessages = protectedProcedure
  .input(z.object({
    limit: z.number().default(50),
  }))
  .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const messages = await db
        .select({
          id: spectatorMessages.id,
          userId: spectatorMessages.userId,
          userName: users.name,
          message: spectatorMessages.message,
          createdAt: spectatorMessages.createdAt,
        })
        .from(spectatorMessages)
        .innerJoin(users, eq(spectatorMessages.userId, users.id))
        .orderBy(desc(spectatorMessages.createdAt))
        .limit(input.limit);

      return {
        messages: messages.reverse(),
        count: messages.length,
      };
    } catch (error) {
      console.error('[GetSpectatorMessages] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting messages',
      });
    }
  });

export const spectatorRouter = router({
  registerSpectator,
  unregisterSpectator,
  getConnectedSpectators,
  sendSpectatorMessage,
  getSpectatorMessages,
});
