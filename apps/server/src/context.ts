import type { Config } from "./lib/config/config.ts";
import type { SessionStore } from "./lib/sessions/sessions.ts";
import type { UsersService } from "./services/users/service.ts";

/** The composed server context — services and infra wired at the root, passed to routes. */
export interface ServerContext {
  readonly config: Config;
  readonly sessions: SessionStore;
  readonly users: UsersService;
}
