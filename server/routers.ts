import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { gameRouter } from "./game";
import { gameControlRouter } from "./gameControl";
import { spinProcedure, getSpinStateProcedure, getGameRoundsHistoryProcedure } from "./spinProcedure";
import { statsRouter } from "./statsRouter";
import { bonusRouter } from "./bonusRouter";
import { spectatorRouter } from "./spectatorRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  game: gameRouter,
  gameControl: gameControlRouter,
  spin: router({
    execute: spinProcedure,
    getState: getSpinStateProcedure,
    getHistory: getGameRoundsHistoryProcedure,
  }),
  stats: statsRouter,
  bonus: bonusRouter,
  spectator: spectatorRouter,
});

export type AppRouter = typeof appRouter;
