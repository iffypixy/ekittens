import "http";
import {Sess} from "express-session";

declare module "http" {
  export interface IncomingMessage {
    session: Sess;
  }
}
