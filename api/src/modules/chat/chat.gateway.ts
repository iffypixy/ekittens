import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {nanoid} from "nanoid";
import {Server, Socket} from "socket.io";

import {ack} from "@lib/ws";
import {User} from "@modules/user";
import {JoinChatDto, SendMessageDto} from "./dtos";
import {events} from "./lib/events";

const room = {
  prefix: "chat",
};

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage(events.server.JOIN_CHAT)
  joinChat(@ConnectedSocket() socket: Socket, @MessageBody() dto: JoinChatDto) {
    socket.join(`${room.prefix}:${dto.chatId}`);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.SEND_MESSAGE)
  sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    const message = {
      id: nanoid(),
      text: dto.text,
      sender: User.create(socket.request.session.user).public,
      createdAt: Date.now(),
    };

    this.server.to(dto.chatId).emit(events.client.NEW_MESSAGE, {message});

    return ack({ok: true});
  }
}
