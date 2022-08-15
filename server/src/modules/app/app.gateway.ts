import {OnGatewayInit, WebSocketGateway} from "@nestjs/websockets";
import {NextFunction, Request, Response} from "express";
import {Server} from "socket.io";
import {Redis} from "ioredis";

import {InjectRedis} from "@lib/redis";
import {session} from "@lib/session";

@WebSocketGateway()
export class AppGateway implements OnGatewayInit {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  afterInit(server: Server) {
    server.use((socket, next: NextFunction) => {
      session(this.redis)(socket.request as Request, {} as Response, next);
    });
  }
}
