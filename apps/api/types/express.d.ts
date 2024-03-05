import "express";
import {SessionWithData} from "express-session";

declare module "express" {
  export interface Request {
    session: SessionWithData;
  }
}
