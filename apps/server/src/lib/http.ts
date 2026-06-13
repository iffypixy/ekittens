import type { ErrorCode } from "@ekittens/contract";

/** Map a stable error code to an HTTP status, the only place codes meet HTTP. */
export const httpStatusFor = (code: ErrorCode): number => {
  switch (code) {
    case "validation-failed":
    case "invalid-id":
    case "invalid-position":
    case "invalid-target":
    case "invalid-combo":
    case "invalid-card":
    case "illegal-move":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
    case "not-eligible":
    case "not-your-turn":
    case "wrong-phase":
    case "card-not-in-hand":
      return 403;
    case "not-found":
      return 404;
    case "conflict":
      return 409;
    case "rate-limited":
      return 429;
    case "internal":
      return 500;
    default:
      return 400;
  }
};
