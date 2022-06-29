import {Injectable, NestMiddleware} from "@nestjs/common";
import {Request, Response, NextFunction} from "express";

import {UserService} from "@modules/user";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    req.session.user = await this.userService.findOne({
      where: {id: req.session.userId},
    });

    next();
  }
}
