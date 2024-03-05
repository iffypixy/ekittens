import "express-session";

import {User} from "@modules/user";

declare module "express-session" {
  export interface SessionWithData extends Session {
    userId: string;
    user: User;
  }
}
