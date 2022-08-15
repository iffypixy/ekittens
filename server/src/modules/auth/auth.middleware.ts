import {Injectable, NestMiddleware} from "@nestjs/common";
import {Request, Response, NextFunction} from "express";

import {User} from "@modules/user";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, _: Response, next: NextFunction): Promise<void> {
    req.session.user = await User.findOne({
      where: {id: req.session.userId},
    });

    next();
  }
}
