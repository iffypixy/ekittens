import type { Brand } from "@ekittens/lib";

export type UserId = Brand<string, "UserId">;
export type MatchId = Brand<string, "MatchId">;
export type LobbyId = Brand<string, "LobbyId">;

/** Within a match, a player is identified by their user id (guests included). */
export type PlayerId = UserId;
