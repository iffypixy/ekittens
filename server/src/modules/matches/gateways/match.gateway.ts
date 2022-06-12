import {InjectRedis} from "@lib/redis";
import {session} from "@lib/session";
import {
  ConnectedSocket,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {NextFunction, Request, Response} from "express";
import {Redis} from "ioredis";
import {Server, Socket} from "socket.io";

const prefix = "match";

const events = {
  server: {
    JOIN_QUEUE: `${prefix}:join-queue`,
  },
};

@WebSocketGateway()
export class MatchGateway implements OnGatewayInit {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  @WebSocketServer()
  private readonly server: Server;

  afterInit() {
    this.server.use((socket, next: NextFunction) => {
      session(this.redis)(socket.request as Request, {} as Response, next);
    });
  }

  @SubscribeMessage(events.server.JOIN_QUEUE)
  joinQueue(@ConnectedSocket() socket: Socket) {
    //
  }
}
