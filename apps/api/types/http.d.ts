import "http";
import {SessionWithData} from "express-session";

declare module "http" {
  export interface IncomingMessage {
    session: SessionWithData;
  }
}
