import type { GameError, UserId } from "@ekittens/contract";
import type { Result } from "@ekittens/lib";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z as zod } from "zod";
import type { ServerContext } from "../../context.ts";
import { httpStatusFor } from "../../lib/http/http.ts";
import { readSessionId } from "../../lib/sessions/cookie.ts";
import type { RelationshipsService } from "./service.ts";

const targetBody = zod.object({ userId: zod.string() });

type Action = (
  service: RelationshipsService,
  me: UserId,
  other: UserId,
) => Promise<Result<void, GameError>>;

export const registerRelationshipsRoutes = (app: FastifyInstance, ctx: ServerContext): void => {
  const userIdOf = async (
    request: Parameters<typeof readSessionId>[0],
  ): Promise<UserId | undefined> => {
    const sid = readSessionId(request);
    return sid === undefined ? undefined : ctx.sessions.userId(sid);
  };

  const action = (path: string, run: Action): void => {
    app.post(path, async (request, reply: FastifyReply) => {
      const me = await userIdOf(request);
      if (me === undefined) return reply.code(401).send({ code: "unauthorized" });
      const body = targetBody.safeParse(request.body);
      if (!body.success) return reply.code(400).send({ code: "validation-failed" });
      const result = await run(ctx.relationships, me, body.data.userId as UserId);
      if (!result.ok) return reply.code(httpStatusFor(result.error.code)).send(result.error);
      return reply.send({ ok: true });
    });
  };

  action("/friends/request", (s, me, other) => s.sendRequest(me, other));
  action("/friends/accept", (s, me, other) => s.accept(me, other));
  action("/friends/decline", (s, me, other) => s.decline(me, other));
  action("/friends/cancel", (s, me, other) => s.cancel(me, other));
  action("/friends/remove", (s, me, other) => s.removeFriend(me, other));
  action("/friends/block", (s, me, other) => s.block(me, other));
  action("/friends/unblock", (s, me, other) => s.unblock(me, other));

  app.get("/friends", async (request, reply) => {
    const me = await userIdOf(request);
    if (me === undefined) return reply.code(401).send({ code: "unauthorized" });
    const [friends, incoming, outgoing] = await Promise.all([
      ctx.relationships.friends(me),
      ctx.relationships.incoming(me),
      ctx.relationships.outgoing(me),
    ]);
    return reply.send({
      friends: friends.map((id) => ({ id, status: ctx.presence.statusOf(id) })),
      incoming,
      outgoing,
    });
  });
};
