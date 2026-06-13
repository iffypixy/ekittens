import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import type { ServerContext } from "./context.ts";
import { registerMatchmakingRoutes } from "./services/matchmaking/routes.ts";
import { registerRatingsRoutes } from "./services/ratings/routes.ts";
import { registerRelationshipsRoutes } from "./services/relationships/routes.ts";
import { registerUserRoutes } from "./services/users/routes.ts";
import { attachWebSocket } from "./ws/server.ts";

/** Build the Fastify HTTP app from a composed context. Side-effect free until listened. */
export const buildApp = async (ctx: ServerContext): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: ctx.config.NODE_ENV === "test" ? false : { level: "info" },
    disableRequestLogging: ctx.config.NODE_ENV === "test",
  });

  await app.register(cors, { origin: ctx.config.CORS_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(cookie, { secret: ctx.config.SESSION_SECRET });

  app.get("/health", () => ({ status: "ok" }));
  app.get("/ready", () => ({ status: "ready" }));

  registerUserRoutes(app, ctx);
  registerRelationshipsRoutes(app, ctx);
  registerRatingsRoutes(app, ctx);
  registerMatchmakingRoutes(app, ctx);

  attachWebSocket(app, ctx);

  return app;
};
