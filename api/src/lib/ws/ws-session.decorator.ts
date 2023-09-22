import {createParamDecorator, ExecutionContext} from "@nestjs/common";
import {Socket} from "socket.io";

export const WsSession = createParamDecorator((_, ctx: ExecutionContext) => {
  const socket: Socket = ctx.switchToWs().getClient();

  return socket.request.session;
});
