import {OnGatewayInit, WebSocketGateway} from "@nestjs/websockets";
import {NextFunction, Request, Response} from "express";
import {Server} from "socket.io";

import {RedisService} from "@lib/redis";
import {session} from "@lib/session";

@WebSocketGateway()
export class AppGateway implements OnGatewayInit {
  constructor(private readonly redisService: RedisService) {}

  afterInit(server: Server) {
    server.use((socket, next: NextFunction) => {
      session(this.redisService.redis)(
        socket.request as Request,
        {} as Response,
        next,
      );
    });
  }
}
