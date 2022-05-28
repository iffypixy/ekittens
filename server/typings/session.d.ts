import "express-session";

import {User} from "@modules/user";

declare module "express-session" {
  interface SessionData extends Session {
    user: User;
  }
}
