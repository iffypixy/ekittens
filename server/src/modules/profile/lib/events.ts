const prefix = "user";

export const events = {
  server: {
    SEND_FRIEND_REQUEST: `${prefix}:send-friend-request`,
    REVOKE_FRIEND_REQUEST: `${prefix}:revoke-friend-request`,
    ACCEPT_FRIEND_REQUEST: `${prefix}:accept-friend-request`,
    REJECT_FRIEND_REQUEST: `${prefix}:reject-friend-request`,
    UNFRIEND: `${prefix}:unfriend`,
    BLOCK: `${prefix}:block`,
    UNBLOCK: `${prefix}:unblock`,
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
