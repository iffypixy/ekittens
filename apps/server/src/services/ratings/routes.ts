import type { FastifyInstance } from "fastify";
import type { ServerContext } from "../../context.ts";

export const registerRatingsRoutes = (app: FastifyInstance, ctx: ServerContext): void => {
  app.get("/leaderboard", async () => ({ entries: await ctx.ratings.leaderboard(50) }));
};
