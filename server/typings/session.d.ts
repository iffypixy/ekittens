import "express-session";

import {User} from "@modules/user";

declare module "express-session" {
  export interface Sess extends Session {
    user: User;
  }
}
