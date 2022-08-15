import {ws} from "@shared/lib/ws";

const prefix = "chat";

const events = {
  server: {
    JOIN_CHAT: `${prefix}:join-chat`,
    SEND_MESSAGE: `${prefix}:send-message`,
  },
  client: {
    NEW_MESSAGE: `${prefix}:new-message`,
  },
};

export interface SendMessageData {
  chatId: string;
  text: string;
}

const sendMessage = (data: SendMessageData) =>
  ws.emit(events.server.SEND_MESSAGE, data);

export interface JoinChatData {
  chatId: string;
}

const joinChat = (data: JoinChatData) => ws.emit(events.server.JOIN_CHAT, data);

export const chatApi = {
  sendMessage,
  joinChat,
};

export const chatEvents = events;
