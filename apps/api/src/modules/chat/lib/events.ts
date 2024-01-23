const prefix = "chat";

export const events = {
  server: {
    SEND_MESSAGE: `${prefix}:send-message`,
    JOIN_CHAT: `${prefix}:join-chat`,
  },
  client: {
    NEW_MESSAGE: `${prefix}:new-message`,
  },
};
