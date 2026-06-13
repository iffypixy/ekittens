import type { Config } from "./lib/config/config.ts";
import type { SessionStore } from "./lib/sessions/sessions.ts";
import type { MatchesService } from "./services/matches/service.ts";
import type { MatchmakingService } from "./services/matchmaking/service.ts";
import type { UsersService } from "./services/users/service.ts";
import type { Hub } from "./ws/hub.ts";

/** The composed server context — services and infra wired at the root, passed to routes/transport. */
export interface ServerContext {
  readonly config: Config;
  readonly sessions: SessionStore;
  readonly users: UsersService;
  readonly hub: Hub;
  readonly matches: MatchesService;
  readonly matchmaking: MatchmakingService;
}
