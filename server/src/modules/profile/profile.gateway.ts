import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {Sess} from "express-session";
import {Server, Socket} from "socket.io";

import {
  RelationshipPublic,
  RELATIONSHIP_STATUS,
  UserService,
  User,
  Relationship,
} from "@modules/user";
import {ack, WsService, WsResponse, WsSession} from "@lib/ws";
import {
  AcceptFriendRequestDto,
  RejectFriendRequestDto,
  RevokeFriendRequestDto,
  SendFriendRequestDto,
  UnfriendDto,
} from "./dtos/gateways";
import {events} from "./lib/events";

@WebSocketGateway()
export class ProfileGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private readonly server: Server;
  private service: WsService;

  constructor(private readonly userService: UserService) {}

  async afterInit(server: Server) {
    this.service = new WsService(server);
  }

  async handleConnection(socket: Socket) {
    const user = socket.request.session.user;

    const {status} = await this.userService.getSupplemental(user.id);

    const isOnline = status === "online";

    if (!isOnline) {
      this.server.emit(events.client.ONLINE, {userId: user.id});

      await this.userService.setInterim(user.id, {status: "online"});
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const user = socket.request.session.user;

    const sockets = this.service
      .getSocketsByUserId(user.id)
      .filter((s) => s.id !== socket.id);

    const isDisconnected = sockets.length === 0;

    if (isDisconnected) {
      this.server.emit(events.client.OFFLINE, {userId: user.id});

      await this.userService.setInterim(user.id, {status: "offline"});
    }
  }

  @SubscribeMessage(events.server.SEND_FRIEND_REQUEST)
  async sendFriendRequest(
    @WsSession() session: Sess,
    @MessageBody() dto: SendFriendRequestDto,
  ): Promise<WsResponse> {
    const user = await User.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {user1: {id: session.user.id}, user2: {id: user.id}},
        {user1: {id: user.id}, user2: {id: session.user.id}},
      ],
    });

    if (!relationship) {
      const created = Relationship.create({
        user1: session.user,
        user2: user,
        status: RELATIONSHIP_STATUS.FRIEND_REQ_1_2,
      });

      await created.save();

      return ack({
        ok: true,
        payload: {status: created.public(session.user.id)},
      });
    }

    const areBlocked = relationship.status === RELATIONSHIP_STATUS.BLOCKED;

    if (areBlocked) return ack({ok: false, msg: "You have blocked each other"});

    const isBlocked =
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_1_2 &&
        relationship.user2.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_2_1 &&
        relationship.user1.id === session.user.id);

    if (isBlocked) return ack({ok: false, msg: "User has blocked you"});

    const hasBlocked =
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_1_2 &&
        relationship.user1.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_2_1 &&
        relationship.user2.id === session.user.id);

    if (hasBlocked) return ack({ok: false, msg: "You have blocked the user"});

    const areFriends = relationship.status === RELATIONSHIP_STATUS.FRIENDS;

    if (areFriends) return ack({ok: false, msg: "You are already friends"});

    const isAlreadySent =
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_1_2 &&
        relationship.user1.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_2_1 &&
        relationship.user2.id === session.user.id);

    if (isAlreadySent)
      return ack({ok: false, msg: "The friend request is already sent"});

    const toAccept =
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_1_2 &&
        relationship.user2.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_2_1 &&
        relationship.user1.id === session.user.id);

    const sockets = this.service.getSocketsByUserId(user.id);

    if (toAccept) {
      relationship.status = RELATIONSHIP_STATUS.FRIENDS;

      await relationship.save();

      sockets.forEach((socket) => {
        socket.emit(events.client.FRIEND_REQUEST_ACCEPTED, {
          user: User.create(session.user).public,
        });
      });

      return ack({
        ok: true,
        payload: {status: relationship.public(session.user.id)},
      });
    }

    const status =
      relationship.user1.id === session.user.id
        ? RELATIONSHIP_STATUS.FRIEND_REQ_1_2
        : RELATIONSHIP_STATUS.FRIEND_REQ_2_1;

    relationship.status = status;

    await relationship.save();

    sockets.forEach((socket) => {
      socket.emit(events.client.FRIEND_REQUEST_RECEIVED, {
        user: User.create(session.user).public,
      });
    });

    return ack({
      ok: true,
      payload: {
        status: relationship.public(session.user.id),
      },
    });
  }

  @SubscribeMessage(events.server.REVOKE_FRIEND_REQUEST)
  async revokeFriendRequest(
    @WsSession() session: Sess,
    @MessageBody() dto: RevokeFriendRequestDto,
  ): Promise<WsResponse> {
    const user = await User.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {user1: {id: session.user.id}, user2: {id: user.id}},
        {user1: {id: user.id}, user2: {id: session.user.id}},
      ],
    });

    const acknowledgment = ack({ok: false, msg: "No friend request found"});

    if (!relationship) return acknowledgment;

    const isFriendRequest =
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_1_2 &&
        relationship.user1.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_2_1 &&
        relationship.user2.id === session.user.id);

    if (!isFriendRequest) return acknowledgment;

    relationship.status = RELATIONSHIP_STATUS.NONE;

    await relationship.save();

    const sockets = this.service.getSocketsByUserId(user.id);

    sockets.forEach((socket) => {
      socket.emit(events.client.FRIEND_REQUEST_REVOKED, {
        user: User.create(session.user).public,
      });
    });

    return ack({
      ok: true,
      payload: {
        status: relationship.public(session.user.id),
      },
    });
  }

  @SubscribeMessage(events.server.ACCEPT_FRIEND_REQUEST)
  async acceptFriendRequest(
    @ConnectedSocket() socket: Socket,
    @WsSession() session: Sess,
    @MessageBody() dto: AcceptFriendRequestDto,
  ): Promise<WsResponse> {
    const user = await User.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {user1: {id: session.user.id}, user2: {id: user.id}},
        {user1: {id: user.id}, user2: {id: session.user.id}},
      ],
    });

    const acknowledgment = ack({ok: false, msg: "No friend request found"});

    if (!relationship) return acknowledgment;

    const isFriendRequest =
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_1_2 &&
        relationship.user2.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.FRIEND_REQ_2_1 &&
        relationship.user1.id === session.user.id);

    if (!isFriendRequest) return acknowledgment;

    relationship.status = RELATIONSHIP_STATUS.FRIENDS;

    await relationship.save();

    const sockets = this.service.getSocketsByUserId(user.id);

    sockets.forEach((socket) => {
      socket.emit(events.client.FRIEND_REQUEST_ACCEPTED, {
        user: User.create(session.user).public,
      });
    });

    return ack({
      ok: true,
      payload: {
        status: relationship.public(session.user.id),
      },
    });
  }

  @SubscribeMessage(events.server.REJECT_FRIEND_REQUEST)
  async rejectFriendRequest(
    @MessageBody() dto: RejectFriendRequestDto,
    @WsSession() session: Sess,
  ): Promise<WsResponse> {
    const user = await User.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {
          user1: {id: session.user.id},
          user2: {id: user.id},
          status: RELATIONSHIP_STATUS.FRIEND_REQ_2_1,
        },
        {
          user1: {id: user.id},
          user2: {id: session.user.id},
          status: RELATIONSHIP_STATUS.FRIEND_REQ_1_2,
        },
      ],
    });

    if (!relationship)
      return ack({
        ok: false,
        msg: "There is no friend request from the specified user",
      });

    relationship.status = RELATIONSHIP_STATUS.NONE;

    await relationship.save();

    const sockets = this.service.getSocketsByUserId(user.id);

    sockets.forEach((socket) => {
      socket.emit(events.client.FRIEND_REQUEST_REJECTED, {
        user: User.create(session.user).public,
      });
    });

    return ack({
      ok: true,
      payload: {
        status: relationship.public(session.user.id),
      },
    });
  }

  @SubscribeMessage(events.server.UNFRIEND)
  async unfriend(
    @WsSession() session: Sess,
    @MessageBody() dto: UnfriendDto,
  ): Promise<WsResponse> {
    const user = await User.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {user1: {id: session.user.id}, user2: {id: user.id}},
        {user1: {id: user.id}, user2: {id: session.user.id}},
      ],
    });

    const acknowledgment = ack({ok: false, msg: "You are not friends"});

    if (!relationship) return acknowledgment;

    const areFriends = relationship.status === RELATIONSHIP_STATUS.FRIENDS;

    if (!areFriends) return acknowledgment;

    const status =
      relationship.user1.id === session.user.id
        ? RELATIONSHIP_STATUS.FRIEND_REQ_2_1
        : RELATIONSHIP_STATUS.FRIEND_REQ_1_2;

    relationship.status = status;

    await relationship.save();

    const sockets = this.service.getSocketsByUserId(user.id);

    sockets.forEach((socket) => {
      socket.emit(events.client.UNFRIENDED, {
        user: User.create(session.user).public,
      });
    });

    return ack({
      ok: true,
      payload: {
        status: relationship.public(session.user.id),
      },
    });
  }

  @SubscribeMessage(events.server.BLOCK)
  async block(
    @WsSession() session: Sess,
    @MessageBody() dto: UnfriendDto,
  ): Promise<WsResponse> {
    const user = await User.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {user1: {id: session.user.id}, user2: {id: user.id}},
        {user1: {id: user.id}, user2: {id: session.user.id}},
      ],
    });

    if (!relationship) {
      const created = Relationship.create({
        user1: session.user,
        user2: user,
        status: RELATIONSHIP_STATUS.BLOCKED_1_2,
      });

      await created.save();

      return ack({
        ok: true,
        payload: {
          status: created.public(session.user.id),
        },
      });
    }

    const areBlocked = relationship.status === RELATIONSHIP_STATUS.BLOCKED;

    const hasBlocked =
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_1_2 &&
        relationship.user1.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_2_1 &&
        relationship.user2.id === session.user.id);

    if (areBlocked && hasBlocked)
      return ack({ok: false, msg: "You have already blocked the user"});

    const isBlocked =
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_1_2 &&
        relationship.user2.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_2_1 &&
        relationship.user1.id === session.user.id);

    const status = isBlocked
      ? RELATIONSHIP_STATUS.BLOCKED
      : relationship.user1.id === session.user.id
      ? RELATIONSHIP_STATUS.BLOCKED_1_2
      : RELATIONSHIP_STATUS.BLOCKED_2_1;

    relationship.status = status;

    await relationship.save();

    return ack({
      ok: true,
      payload: {
        status: relationship.public(session.user.id),
      },
    });
  }

  @SubscribeMessage(events.server.UNBLOCK)
  async unblock(
    @WsSession() session: Sess,
    @MessageBody() dto: UnfriendDto,
  ): Promise<WsResponse> {
    const user = await User.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await Relationship.findOne({
      where: [
        {user1: {id: session.user.id}, user2: {id: user.id}},
        {user1: {id: user.id}, user2: {id: session.user.id}},
      ],
    });

    const acknowledgment = ack({
      ok: false,
      msg: "You have not blocked the user",
    });

    if (!relationship) return acknowledgment;

    const areBlocked = relationship.status === RELATIONSHIP_STATUS.BLOCKED;

    const hasBlocked =
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_1_2 &&
        relationship.user1.id === session.user.id) ||
      (relationship.status === RELATIONSHIP_STATUS.BLOCKED_2_1 &&
        relationship.user2.id === session.user.id);

    if (!(areBlocked || hasBlocked)) return acknowledgment;

    let status: RelationshipPublic = RELATIONSHIP_STATUS.NONE;

    if (areBlocked) {
      status =
        relationship.user1.id === session.user.id
          ? RELATIONSHIP_STATUS.BLOCKED_2_1
          : RELATIONSHIP_STATUS.BLOCKED_1_2;
    }

    relationship.status = status;

    await relationship.save();

    return ack({
      ok: true,
      payload: {
        status: relationship.public(session.user.id),
      },
    });
  }
}
