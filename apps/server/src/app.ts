import cookie from "@fastify/cookie";
import Fastify, { type FastifyInstance } from "fastify";
import type { ServerContext } from "./context.ts";
import { registerUserRoutes } from "./services/users/routes.ts";

/** Build the Fastify HTTP app from a composed context. Side-effect free until listened. */
export const buildApp = async (ctx: ServerContext): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: ctx.config.NODE_ENV === "test" ? false : { level: "info" },
    disableRequestLogging: ctx.config.NODE_ENV === "test",
  });

  await app.register(cookie, { secret: ctx.config.SESSION_SECRET });

  app.get("/health", () => ({ status: "ok" }));
  app.get("/ready", () => ({ status: "ready" }));

  registerUserRoutes(app, ctx);

  return app;
};
