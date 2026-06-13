import type { FastifyReply, FastifyRequest } from "fastify";
import type { Config } from "./config.ts";

const COOKIE = "sid";

export const setSessionCookie = (reply: FastifyReply, sid: string, config: Config): void => {
  reply.setCookie(COOKIE, sid, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    path: "/",
    maxAge: config.SESSION_TTL_SECONDS,
  });
};

export const clearSessionCookie = (reply: FastifyReply): void => {
  reply.clearCookie(COOKIE, { path: "/" });
};

/** Read and verify the signed session-id cookie, or `undefined` if absent/tampered. */
export const readSessionId = (request: FastifyRequest): string | undefined => {
  const raw = request.cookies[COOKIE];
  if (raw === undefined) return undefined;
  const unsigned = request.unsignCookie(raw);
  return unsigned.valid && unsigned.value !== null ? unsigned.value : undefined;
};
