import type { Config } from "./lib/config.ts";
import type { SessionStore } from "./lib/sessions.ts";
import type { MatchesService } from "./services/matches/service.ts";
import type { MatchmakingService } from "./services/matchmaking/service.ts";
import type { PresenceService } from "./services/presence/service.ts";
import type { RatingsService } from "./services/ratings/service.ts";
import type { RelationshipsService } from "./services/relationships/service.ts";
import type { UsersService } from "./services/users/service.ts";
import type { Hub } from "./ws/hub.ts";

/** The composed server context — services and infra wired at the root, passed to routes/transport. */
export interface ServerContext {
  config: Config;
  sessions: SessionStore;
  users: UsersService;
  relationships: RelationshipsService;
  ratings: RatingsService;
  presence: PresenceService;
  hub: Hub;
  matches: MatchesService;
  matchmaking: MatchmakingService;
}
