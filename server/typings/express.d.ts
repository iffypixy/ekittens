import "express";
import {Sess} from "express-session";

declare module "express" {
  export interface Request {
    session: Sess;
  }
}
