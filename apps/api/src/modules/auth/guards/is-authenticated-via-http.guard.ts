import {Injectable, CanActivate, ExecutionContext} from "@nestjs/common";
import {Request} from "express";

@Injectable()
export class IsAuthenticatedViaHttpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();

    return !!req.session && !!req.session.userId;
  }
}
