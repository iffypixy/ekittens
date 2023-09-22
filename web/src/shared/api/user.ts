import {ws} from "@shared/lib/ws";
import {RelationshipType, UserInterim} from "./common";

const prefix = "user";

export const userEvents = {
  server: {
    SEND_FRIEND_REQUEST: `${prefix}:send-friend-request`,
    REVOKE_FRIEND_REQUEST: `${prefix}:revoke-friend-request`,
    ACCEPT_FRIEND_REQUEST: `${prefix}:accept-friend-request`,
    REJECT_FRIEND_REQUEST: `${prefix}:reject-friend-request`,
    UNFRIEND: `${prefix}:unfriend`,
    GET_SUPPLEMENTAL: `${prefix}:get-supplemental`,
  },
  client: {
    ONLINE: `${prefix}:online`,
    OFFLINE: `${prefix}:offline`,
    FRIEND_REQUEST_RECEIVED: `${prefix}:friend-request-received`,
    FRIEND_REQUEST_ACCEPTED: `${prefix}:friend-request-accepted`,
    FRIEND_REQUEST_REJECTED: `${prefix}:friend-request-rejected`,
    FRIEND_REQUEST_REVOKED: `${prefix}:friend-request-revoked`,
    UNFRIENDED: `${prefix}:unfriended`,
  },
};

export interface RelationshipRequestResponse {
  status: RelationshipType;
}

export interface SendFriendRequestData {
  userId: string;
}

const sendFriendRequest = (data: SendFriendRequestData) =>
  ws.emit<SendFriendRequestData, RelationshipRequestResponse>(
    userEvents.server.SEND_FRIEND_REQUEST,
    data,
  );

export interface RevokeFriendRequestData {
  userId: string;
}

const revokeFriendRequest = (data: RevokeFriendRequestData) =>
  ws.emit<RevokeFriendRequestData, RelationshipRequestResponse>(
    userEvents.server.REVOKE_FRIEND_REQUEST,
    data,
  );

export interface AcceptFriendRequestData {
  userId: string;
}

const acceptFriendRequest = (data: AcceptFriendRequestData) =>
  ws.emit<AcceptFriendRequestData, RelationshipRequestResponse>(
    userEvents.server.ACCEPT_FRIEND_REQUEST,
    data,
  );

export interface RejectFriendRequestData {
  userId: string;
}

const rejectFriendRequest = (data: RejectFriendRequestData) =>
  ws.emit<RejectFriendRequestData, RelationshipRequestResponse>(
    userEvents.server.SEND_FRIEND_REQUEST,
    data,
  );

export interface UnfriendData {
  userId: string;
}

const unfriend = (data: UnfriendData) =>
  ws.emit<UnfriendData, RelationshipRequestResponse>(
    userEvents.server.UNFRIEND,
    data,
  );

export interface GetInterimData {
  ids: string[];
}

export interface GetInterimResponse {
  supplementals: Record<string, UserInterim>;
}

const getInterim = (data: GetInterimData) =>
  ws.emit<GetInterimData, GetInterimResponse>(
    userEvents.server.GET_SUPPLEMENTAL,
    data,
  );

export const userApi = {
  sendFriendRequest,
  revokeFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  getInterim,
};
