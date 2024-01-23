import {io} from "socket.io-client";

export const socket = io(import.meta.env.VITE_BACKEND_URL, {
  withCredentials: true,
});

export interface WsResponse<T> {
  ok: boolean;
  msg: string;
  payload: T;
}

const timeout = 5000;

const INTERNAL_SERVER_ERROR = "Something went wrong...";

type Listener = (...args: any[]) => void;

export const ws = {
  emit: <P = void, R = void>(event: string, payload?: P) =>
    new Promise<R>((resolve, reject) => {
      socket
        .timeout(timeout)
        .emit(event, payload, (error: Error, response: WsResponse<R>) => {
          if (error) reject(INTERNAL_SERVER_ERROR);

          if (response.ok) resolve(response.payload);
          else reject(response.msg);
        });
    }),
  on: (event: string, listener: Listener) => {
    socket.on(event, listener);
  },
  off: (events: string[]) => {
    events.forEach((event) => {
      socket.off(event);
    });
  },
  disable: (event: string, listener: Listener) => {
    socket.off(event, listener);
  },
};

export interface WsError {
  msg: string;
}
