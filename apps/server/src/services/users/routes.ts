import type { UserId } from "@ekittens/contract";
import type { FastifyInstance } from "fastify";
import { z as zod } from "zod";
import type { ServerContext } from "../../context.ts";
import { clearSessionCookie, readSessionId, setSessionCookie } from "../../lib/cookie.ts";
import { httpStatusFor } from "../../lib/http.ts";

const guestBody = zod.object({ handle: zod.string() });
const registerBody = zod.object({
  username: zod.string(),
  password: zod.string(),
  handle: zod.string().optional(),
});
const loginBody = zod.object({ username: zod.string(), password: zod.string() });

export const registerUserRoutes = (app: FastifyInstance, ctx: ServerContext): void => {
  const currentUserId = async (
    request: Parameters<typeof readSessionId>[0],
  ): Promise<UserId | undefined> => {
    const sid = readSessionId(request);
    return sid === undefined ? undefined : ctx.sessions.userId(sid);
  };

  app.post("/auth/guest", async (request, reply) => {
    const body = guestBody.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ code: "validation-failed" });
    const result = await ctx.users.createGuest(body.data.handle);
    if (!result.ok) return reply.code(httpStatusFor(result.error.code)).send(result.error);
    setSessionCookie(reply, await ctx.sessions.create(result.value.id), ctx.config);
    return reply.send(result.value);
  });

  app.post("/auth/register", async (request, reply) => {
    const body = registerBody.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ code: "validation-failed" });
    const userId = await currentUserId(request);
    const result = await ctx.users.register({ userId, ...body.data });
    if (!result.ok) return reply.code(httpStatusFor(result.error.code)).send(result.error);
    setSessionCookie(reply, await ctx.sessions.create(result.value.id), ctx.config);
    return reply.send(result.value);
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginBody.safeParse(request.body);
    if (!body.success) return reply.code(400).send({ code: "validation-failed" });
    const result = await ctx.users.login(body.data);
    if (!result.ok) return reply.code(httpStatusFor(result.error.code)).send(result.error);
    setSessionCookie(reply, await ctx.sessions.create(result.value.id), ctx.config);
    return reply.send(result.value);
  });

  app.post("/auth/logout", async (request, reply) => {
    const sid = readSessionId(request);
    if (sid !== undefined) await ctx.sessions.destroy(sid);
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });

  app.get("/users/me", async (request, reply) => {
    const userId = await currentUserId(request);
    if (userId === undefined) return reply.code(401).send({ code: "unauthorized" });
    const user = await ctx.users.byId(userId);
    if (user === undefined) return reply.code(404).send({ code: "not-found" });
    return reply.send(user);
  });

  app.delete("/users/me", async (request, reply) => {
    const userId = await currentUserId(request);
    if (userId === undefined) return reply.code(401).send({ code: "unauthorized" });
    await ctx.users.remove(userId);
    const sid = readSessionId(request);
    if (sid !== undefined) await ctx.sessions.destroy(sid);
    clearSessionCookie(reply);
    return reply.send({ ok: true });
  });
};
