import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { bonuses, users } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

/**
 * Obtener bonificaciones activas del usuario
 */
const getActiveBonuses = protectedProcedure
  .query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const activeBonuses = await db
        .select()
        .from(bonuses)
        .where(
          and(
            eq(bonuses.userId, ctx.user!.id),
            eq(bonuses.isActive, 1)
          )
        );

      return {
        bonuses: activeBonuses,
        totalMultiplier: activeBonuses.reduce((mult, b) => mult * b.multiplier, 1),
        totalBonus: activeBonuses.reduce((sum, b) => sum + b.amount, 0),
      };
    } catch (error) {
      console.error('[GetActiveBonuses] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error getting active bonuses',
      });
    }
  });

/**
 * Aplicar bono de bienvenida al usuario nuevo
 */
const applyWelcomeBonus = protectedProcedure
  .mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verificar si el usuario ya tiene bono de bienvenida
      const existingBonus = await db
        .select()
        .from(bonuses)
        .where(
          and(
            eq(bonuses.userId, ctx.user!.id),
            eq(bonuses.type, 'welcome_bonus')
          )
        )
        .limit(1);

      if (existingBonus.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Welcome bonus already applied',
        });
      }

      // Crear bono de bienvenida (100 Reales)
      const bonusAmount = 100;
      await db.insert(bonuses).values({
        userId: ctx.user!.id,
        type: 'welcome_bonus',
        amount: bonusAmount,
        multiplier: 1,
        description: 'Bono de bienvenida para nuevos usuarios',
        isActive: 1,
        appliedAt: new Date(),
      });

      // Actualizar saldo del usuario
      const newBalance = user[0].balance + bonusAmount;
      await db
        .update(users)
        .set({ balance: newBalance })
        .where(eq(users.id, ctx.user!.id));

      return {
        success: true,
        bonusAmount,
        newBalance,
      };
    } catch (error) {
      console.error('[ApplyWelcomeBonus] Error:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error applying welcome bonus',
      });
    }
  });

/**
 * Aplicar multiplicador de pozo en horas específicas (happy hour)
 */
const applyHourlyMultiplier = protectedProcedure
  .mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database not available',
      });
    }

    try {
      const now = new Date();
      const hour = now.getHours();

      // Happy hours: 12-13 (mediodía) y 20-21 (noche)
      const isHappyHour = (hour >= 12 && hour < 13) || (hour >= 20 && hour < 21);

      if (!isHappyHour) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Happy hour is not active right now',
        });
      }

      // Verificar si el usuario ya tiene multiplicador activo hoy
      const today = new Date().toISOString().split('T')[0];
      const existingMultiplier = await db
        .select()
        .from(bonuses)
        .where(
          and(
            eq(bonuses.userId, ctx.user!.id),
            eq(bonuses.type, 'hourly_multiplier')
          )
        )
        .limit(1);

      if (existingMultiplier.length > 0 && existingMultiplier[0].appliedAt) {
        const appliedDate = new Date(existingMultiplier[0].appliedAt).toISOString().split('T')[0];
        if (appliedDate === today) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Hourly multiplier already applied today',
          });
        }
      }

      // Crear multiplicador (2x en happy hour)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await db.insert(bonuses).values({
        userId: ctx.user!.id,
        type: 'hourly_multiplier',
        amount: 0,
        multiplier: 2,
        description: 'Multiplicador de happy hour (2x)',
        isActive: 1,
        expiresAt,
        appliedAt: new Date(),
      });

      return {
        success: true,
        multiplier: 2,
        expiresAt,
        message: 'Happy hour multiplier activated! 2x for 1 hour',
      };
    } catch (error) {
      console.error('[ApplyHourlyMultiplier] Error:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error applying hourly multiplier',
      });
    }
  });

/**
 * Aplicar bono por racha de victorias
 */
const applyStreakBonus = protectedProcedure
  .input(z.object({
    streak: z.number().min(3).max(10),
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
      // Calcular bono basado en racha (5 Reales por victoria en la racha)
      const bonusAmount = input.streak * 5;

      await db.insert(bonuses).values({
        userId: ctx.user!.id,
        type: 'streak_bonus',
        amount: bonusAmount,
        multiplier: 1,
        description: `Bono por racha de ${input.streak} victorias`,
        isActive: 1,
        appliedAt: new Date(),
      });

      // Actualizar saldo del usuario
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user!.id))
        .limit(1);

      if (user[0]) {
        const newBalance = user[0].balance + bonusAmount;
        await db
          .update(users)
          .set({ balance: newBalance })
          .where(eq(users.id, ctx.user!.id));
      }

      return {
        success: true,
        streak: input.streak,
        bonusAmount,
        message: `Congratulations! You won ${bonusAmount} Reales for your ${input.streak}-win streak!`,
      };
    } catch (error) {
      console.error('[ApplyStreakBonus] Error:', error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error applying streak bonus',
      });
    }
  });

export const bonusRouter = router({
  getActiveBonuses,
  applyWelcomeBonus,
  applyHourlyMultiplier,
  applyStreakBonus,
});
