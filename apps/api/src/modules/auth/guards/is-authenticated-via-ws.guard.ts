import {Injectable, CanActivate, ExecutionContext} from "@nestjs/common";
import {WsException} from "@nestjs/websockets";
import {Socket} from "socket.io";

import {ack} from "@lib/ws";

@Injectable()
export class IsAuthenticatedViaWsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const socket: Socket = context.switchToWs().getClient();

    const session = socket.request.session;

    const isAuthenticated = !!session && !!session.userId;

    if (!isAuthenticated)
      throw new WsException(
        ack({
          ok: false,
          msg: "You are not authorized",
        }),
      );

    return true;
  }
}
