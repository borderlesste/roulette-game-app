import { publicProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { gameRounds, users } from '../drizzle/schema';
import { desc, eq } from 'drizzle-orm';

/**
 * Router para gestionar el historial de ganadores
 */
export const winnersRouter = router({
  /**
   * Obtiene los últimos 5 ganadores con sus detalles
   */
  getRecentWinners: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return [];
    }

    try {
      const recentWinners = await db
        .select({
          id: gameRounds.id,
          winnerName: users.name,
          winnerId: gameRounds.winnerId,
          prizeAmount: gameRounds.prizeAmount,
          potAtTime: gameRounds.potAtTime,
          winnerEntryAmount: gameRounds.winnerEntryAmount,
          completedAt: gameRounds.completedAt,
        })
        .from(gameRounds)
        .innerJoin(users, eq(gameRounds.winnerId, users.id))
        .orderBy(desc(gameRounds.completedAt))
        .limit(5);

      return recentWinners.map((winner) => ({
        id: winner.id,
        winnerName: winner.winnerName || 'Desconocido',
        winnerId: winner.winnerId,
        prizeAmount: winner.prizeAmount,
        potAtTime: winner.potAtTime,
        winnerEntryAmount: winner.winnerEntryAmount,
        completedAt: winner.completedAt,
        // Calcular tiempo relativo (ej: "hace 2 minutos")
        timeAgo: getTimeAgo(winner.completedAt),
      }));
    } catch (error) {
      console.error('[Winners Router] Error fetching recent winners:', error);
      return [];
    }
  }),

  /**
   * Obtiene estadísticas de ganadores (top 10 por premios totales)
   */
  getTopWinners: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      return [];
    }

    try {
      // Obtener los 10 usuarios con más premios totales
      const topWinners = await db
        .select({
          winnerId: gameRounds.winnerId,
          winnerName: users.name,
          totalPrizes: gameRounds.prizeAmount,
          winCount: gameRounds.id,
        })
        .from(gameRounds)
        .innerJoin(users, eq(gameRounds.winnerId, users.id))
        .orderBy(desc(gameRounds.prizeAmount))
        .limit(10);

      return topWinners;
    } catch (error) {
      console.error('[Winners Router] Error fetching top winners:', error);
      return [];
    }
  }),

  /**
   * Obtiene el historial completo de rondas con paginación
   */
  getGameHistory: publicProcedure
    .input((input: unknown) => {
      const page = typeof input === 'object' && input !== null && 'page' in input
        ? (input as { page: number }).page
        : 1;
      return { page: Math.max(1, page) };
    })
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { rounds: [], total: 0, page: input.page, pageSize: 10 };
      }

      try {
        const pageSize = 10;
        const offset = (input.page - 1) * pageSize;

        const rounds = await db
          .select({
            id: gameRounds.id,
            winnerName: users.name,
            winnerId: gameRounds.winnerId,
            prizeAmount: gameRounds.prizeAmount,
            potAtTime: gameRounds.potAtTime,
            winnerEntryAmount: gameRounds.winnerEntryAmount,
            completedAt: gameRounds.completedAt,
          })
          .from(gameRounds)
          .innerJoin(users, eq(gameRounds.winnerId, users.id))
          .orderBy(desc(gameRounds.completedAt))
          .limit(pageSize)
          .offset(offset);

        // Obtener el total de rondas
        const totalResult = await db
          .select({ count: gameRounds.id })
          .from(gameRounds);

        const total = totalResult.length;

        return {
          rounds: rounds.map((round) => ({
            ...round,
            winnerName: round.winnerName || 'Desconocido',
            timeAgo: getTimeAgo(round.completedAt),
          })),
          total,
          page: input.page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      } catch (error) {
        console.error('[Winners Router] Error fetching game history:', error);
        return { rounds: [], total: 0, page: input.page, pageSize: 10, totalPages: 0 };
      }
    }),
});

/**
 * Calcula el tiempo relativo desde una fecha
 * Ej: "hace 2 minutos", "hace 1 hora", etc.
 */
function getTimeAgo(date: Date | null): string {
  if (!date) return 'hace poco';

  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'hace unos segundos';
  if (diffMins < 60) return `hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 7) return `hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

  return date.toLocaleDateString('es-ES');
}
