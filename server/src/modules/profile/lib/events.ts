const prefix = "user";

export const events = {
  server: {
    SEND_FRIEND_REQUEST: `${prefix}:send-friend-request`,
    REVOKE_FRIEND_REQUEST: `${prefix}:revoke-friend-request`,
    ACCEPT_FRIEND_REQUEST: `${prefix}:accept-friend-request`,
    UNFRIEND: `${prefix}:unfriend`,
    BLOCK: `${prefix}:block`,
    UNBLOCK: `${prefix}:unblock`,
  },
  client: {
    ONLINE: `${prefix}:online`,
    OFFLINE: `${prefix}:offline`,
    FRIEND_REQUEST_SEND: `${prefix}:friend-request-send`,
    FRIEND_REQUEST_ACCEPT: `${prefix}:friend-request-accept`,
    FRIEND_REQUEST_REJECT: `${prefix}:friend-request-reject`,
    FRIEND_REQUEST_REVOKE: `${prefix}:friend-request-revoke`,
    UNFRIENDED: `${prefix}:unfriended`,
  },
};
