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
};
