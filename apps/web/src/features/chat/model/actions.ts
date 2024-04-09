import {createAction, createAsyncThunk} from "@reduxjs/toolkit";

import {chatApi, JoinChatData, SendMessageData} from "@shared/api/chat";
import {ChatMessage} from "@shared/api/common";

const prefix = "chat";

export type JoinChatOptions = JoinChatData;

export const joinChat = createAsyncThunk<void, JoinChatOptions>(
  `${prefix}/joinChat`,
  async (options) => {
    return chatApi.joinChat(options);
  },
);

export type SendMessageOptions = SendMessageData;

export const sendMessage = createAsyncThunk<void, SendMessageOptions>(
  `${prefix}/sendMessage`,
  async (options) => {
    return chatApi.sendMessage(options);
  },
);

export interface AddMessagePayload {
  message: ChatMessage;
}

export const addMessage = createAction<AddMessagePayload>(
  `${prefix}/addMessage`,
);

export const resetChat = createAction(`${prefix}/resetChat`);
