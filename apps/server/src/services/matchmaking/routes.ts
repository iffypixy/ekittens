import type { FastifyInstance } from "fastify";
import type { ServerContext } from "../../context.ts";
import { readSessionId } from "../../lib/sessions/cookie.ts";

export const registerMatchmakingRoutes = (app: FastifyInstance, ctx: ServerContext): void => {
  const userIdOf = async (request: Parameters<typeof readSessionId>[0]) => {
    const sid = readSessionId(request);
    return sid === undefined ? undefined : ctx.sessions.userId(sid);
  };

  app.post("/matchmaking/join", async (request, reply) => {
    const userId = await userIdOf(request);
    if (userId === undefined) return reply.code(401).send({ code: "unauthorized" });
    ctx.matchmaking.join(userId);
    return reply.send({ ok: true });
  });

  app.post("/matchmaking/leave", async (request, reply) => {
    const userId = await userIdOf(request);
    if (userId === undefined) return reply.code(401).send({ code: "unauthorized" });
    ctx.matchmaking.leave(userId);
    return reply.send({ ok: true });
  });
};
