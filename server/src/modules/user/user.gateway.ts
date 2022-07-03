import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {Sess} from "express-session";
import {Server, Socket} from "socket.io";

import {RedisService, RP} from "@lib/redis";
import {ack, WsHelper, WsResponse, WsSession} from "@lib/ws";
import {
  AcceptFriendRequestDto,
  RevokeFriendRequestDto,
  SendFriendRequestDto,
  UnfriendDto,
} from "./dtos/gateways";
import {events} from "./lib/events";
import {RelationshipStatus, UserInterim} from "./lib/typings";
import {RELATIONSHIP_STATUS} from "./lib/constants";
import {RelationshipService, UserService} from "./services";

@WebSocketGateway()
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private readonly server: Server;
  private readonly helper: WsHelper;

  constructor(
    private readonly userService: UserService,
    private readonly relationshipService: RelationshipService,
    private readonly redisService: RedisService,
  ) {
    this.helper = new WsHelper(this.server);
  }

  async handleConnection(socket: Socket) {
    const user = socket.request.session.user;

    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${user.id}`,
    );

    const isOnline = interim && interim.isOnline;

    if (!isOnline) {
      // @todo: notify everyone

      await this.redisService.update(`${RP.USER}:${user.id}`, {isOnline: true});
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const user = socket.request.session.user;

    const sockets = this.helper
      .getSocketsByUserId(user.id)
      .filter((s) => s.id !== socket.id);

    const isDisconnected = sockets.length === 0;

    if (isDisconnected) {
      // @todo: notify everyone

      await this.redisService.update<UserInterim>(`${RP.USER}:${user.id}`, {
        isOnline: false,
      });
    }
  }

  @SubscribeMessage(events.server.SEND_FRIEND_REQUEST)
  async sendFriendRequest(
    @ConnectedSocket() socket: Socket,
    @WsSession() session: Sess,
    @MessageBody() dto: SendFriendRequestDto,
  ): Promise<WsResponse> {
    const user = await this.userService.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await this.relationshipService.findOne({
      where: [
        {user1: session.user, user2: user},
        {user1: user, user2: session.user},
      ],
    });

    if (!relationship) {
      const status = RELATIONSHIP_STATUS.FRIEND_REQ_1_2;

      await this.relationshipService.create({
        user1: session.user,
        user2: user,
        status,
      });

      return ack({ok: true, payload: {status}});
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

    if (toAccept) {
      const status = RELATIONSHIP_STATUS.FRIENDS;

      await this.relationshipService.update(relationship, {status});

      return ack({ok: true, payload: {status}});
    }

    const status =
      relationship.user1.id === session.user.id
        ? RELATIONSHIP_STATUS.FRIEND_REQ_1_2
        : RELATIONSHIP_STATUS.FRIEND_REQ_2_1;

    await this.relationshipService.update(relationship, {status});

    return ack({ok: true, payload: {status}});
  }

  @SubscribeMessage(events.server.REVOKE_FRIEND_REQUEST)
  async revokeFriendRequest(
    @ConnectedSocket() socket: Socket,
    @WsSession() session: Sess,
    @MessageBody() dto: RevokeFriendRequestDto,
  ): Promise<WsResponse> {
    const user = await this.userService.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await this.relationshipService.findOne({
      where: [
        {user1: session.user, user2: user},
        {user1: user, user2: session.user},
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

    const status = RELATIONSHIP_STATUS.NONE;

    await this.relationshipService.update(relationship, {status});

    return ack({ok: true, payload: {status}});
  }

  @SubscribeMessage(events.server.ACCEPT_FRIEND_REQUEST)
  async acceptFriendRequest(
    @ConnectedSocket() socket: Socket,
    @WsSession() session: Sess,
    @MessageBody() dto: AcceptFriendRequestDto,
  ): Promise<WsResponse> {
    const user = await this.userService.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await this.relationshipService.findOne({
      where: [
        {user1: session.user, user2: user},
        {user1: user, user2: session.user},
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

    const status = RELATIONSHIP_STATUS.FRIENDS;

    await this.relationshipService.update(relationship, {status});

    return ack({ok: true, payload: {status}});
  }

  @SubscribeMessage(events.server.UNFRIEND)
  async unfriend(
    @ConnectedSocket() socket: Socket,
    @WsSession() session: Sess,
    @MessageBody() dto: UnfriendDto,
  ): Promise<WsResponse> {
    const user = await this.userService.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await this.relationshipService.findOne({
      where: [
        {user1: session.user, user2: user},
        {user1: user, user2: session.user},
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

    await this.relationshipService.update(relationship, {status});

    return ack({ok: true, payload: {status}});
  }

  @SubscribeMessage(events.server.BLOCK)
  async block(
    @ConnectedSocket() socket: Socket,
    @WsSession() session: Sess,
    @MessageBody() dto: UnfriendDto,
  ): Promise<WsResponse> {
    const user = await this.userService.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await this.relationshipService.findOne({
      where: [
        {user1: session.user, user2: user},
        {user1: user, user2: session.user},
      ],
    });

    if (!relationship) {
      const status = RELATIONSHIP_STATUS.BLOCKED_1_2;

      await this.relationshipService.create({
        user1: session.user,
        user2: user,
        status: RELATIONSHIP_STATUS.BLOCKED_1_2,
      });

      return ack({ok: true, payload: {status}});
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

    await this.relationshipService.update(relationship, {status});

    return ack({ok: true, payload: {status}});
  }

  @SubscribeMessage(events.server.UNBLOCK)
  async unblock(
    @ConnectedSocket() socket: Socket,
    @WsSession() session: Sess,
    @MessageBody() dto: UnfriendDto,
  ): Promise<WsResponse> {
    const user = await this.userService.findOne({where: {id: dto.userId}});

    if (!user) return ack({ok: false, msg: "No user found"});

    const relationship = await this.relationshipService.findOne({
      where: [
        {user1: session.user, user2: user},
        {user1: user, user2: session.user},
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

    let status: RelationshipStatus = RELATIONSHIP_STATUS.NONE;

    if (areBlocked) {
      status =
        relationship.user1.id === session.user.id
          ? RELATIONSHIP_STATUS.BLOCKED_2_1
          : RELATIONSHIP_STATUS.BLOCKED_1_2;
    }

    await this.relationshipService.update(relationship, {status});

    return ack({ok: true, payload: {status}});
  }
}
