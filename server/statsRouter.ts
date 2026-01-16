import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { userDailyStats, users } from '../drizzle/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Obtener estadísticas del usuario para los últimos 30 días
 */
const getUserStatsLast30Days = protectedProcedure
  .query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const stats = await db
        .select()
        .from(userDailyStats)
        .where(
          and(
            eq(userDailyStats.userId, ctx.user!.id),
            gte(userDailyStats.date, dateStr)
          )
        )
        .orderBy(desc(userDailyStats.date));

      // Calcular totales
      const totals = {
        gamesPlayed: stats.reduce((sum, s) => sum + s.gamesPlayed, 0),
        gamesWon: stats.reduce((sum, s) => sum + s.gamesWon, 0),
        totalWinnings: stats.reduce((sum, s) => sum + s.totalWinnings, 0),
        totalLosses: stats.reduce((sum, s) => sum + s.totalLosses, 0),
        winRate: 0,
      };

      if (totals.gamesPlayed > 0) {
        totals.winRate = Math.round((totals.gamesWon / totals.gamesPlayed) * 100);
      }

      return {
        stats,
        totals,
      };
    } catch (error) {
      console.error('[GetUserStats] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting user statistics',
      });
    }
  });

/**
 * Obtener ranking de usuarios por ganancias totales
 */
const getLeaderboard = protectedProcedure
  .input(z.object({
    limit: z.number().default(10),
    period: z.enum(['all_time', 'last_30_days', 'today']).default('all_time'),
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
      let users_list;

      if (input.period === 'all_time') {
        // Obtener ranking de todos los tiempos
        users_list = await db
          .select({
            id: users.id,
            name: users.name,
            totalWinnings: users.totalWinnings,
            gamesPlayed: users.gamesPlayed,
          })
          .from(users)
          .orderBy(desc(users.totalWinnings))
          .limit(input.limit);
      } else if (input.period === 'last_30_days') {
        // Obtener ranking de últimos 30 días
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

        users_list = await db
          .select({
            id: users.id,
            name: users.name,
            totalWinnings: userDailyStats.totalWinnings,
            gamesPlayed: userDailyStats.gamesPlayed,
          })
          .from(userDailyStats)
          .innerJoin(users, eq(userDailyStats.userId, users.id))
          .where(gte(userDailyStats.date, dateStr))
          .orderBy(desc(userDailyStats.totalWinnings))
          .limit(input.limit);
      } else {
        // Obtener ranking de hoy
        const today = new Date().toISOString().split('T')[0];

        users_list = await db
          .select({
            id: users.id,
            name: users.name,
            totalWinnings: userDailyStats.totalWinnings,
            gamesPlayed: userDailyStats.gamesPlayed,
          })
          .from(userDailyStats)
          .innerJoin(users, eq(userDailyStats.userId, users.id))
          .where(eq(userDailyStats.date, today))
          .orderBy(desc(userDailyStats.totalWinnings))
          .limit(input.limit);
      }

      // Encontrar posición del usuario actual
      let userRank = 0;
      users_list.forEach((u, index) => {
        if (u.id === ctx.user!.id) {
          userRank = index + 1;
        }
      });

      return {
        leaderboard: users_list,
        userRank,
        period: input.period,
      };
    } catch (error) {
      console.error('[GetLeaderboard] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting leaderboard',
      });
    }
  });

/**
 * Obtener estadísticas comparativas del usuario vs promedio
 */
const getComparisonStats = protectedProcedure
  .query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      // Obtener estadísticas del usuario
      const userStats = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .limit(1);

      if (!userStats[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Calcular promedio de todos los usuarios
      const allUsers = await db.select().from(users);
      const avgWinnings = allUsers.reduce((sum, u) => sum + u.totalWinnings, 0) / allUsers.length;
      const avgGamesPlayed = allUsers.reduce((sum, u) => sum + u.gamesPlayed, 0) / allUsers.length;

      return {
        userStats: userStats[0],
        averageWinnings: Math.round(avgWinnings),
        averageGamesPlayed: Math.round(avgGamesPlayed),
        comparisonPercentage: {
          winnings: userStats[0].totalWinnings > 0 ? Math.round((userStats[0].totalWinnings / avgWinnings) * 100) : 0,
          gamesPlayed: userStats[0].gamesPlayed > 0 ? Math.round((userStats[0].gamesPlayed / avgGamesPlayed) * 100) : 0,
        },
      };
    } catch (error) {
      console.error('[GetComparisonStats] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting comparison statistics',
      });
    }
  });

export const statsRouter = router({
  getUserStats: getUserStatsLast30Days,
  getLeaderboard,
  getComparisonStats,
});
