import "http";
import {SessionData} from "express-session";

declare module "http" {
  interface IncomingMessage {
    session: SessionData;
  }
}
