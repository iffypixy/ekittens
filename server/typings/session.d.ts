import "express-session";

import {User} from "@modules/users";

declare module "express-session" {
  export interface Sess extends Session {
    user: User;
  }
}
