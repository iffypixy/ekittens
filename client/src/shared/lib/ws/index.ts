import {io} from "socket.io-client";

export const socket = io(process.env.BACKEND_URL, {
  withCredentials: true,
});

interface WsResponse<T> {
  ok: boolean;
  msg: string;
  payload: T;
}

const timeout = 5000;

const INTERNAL_SERVER_ERROR = "Something went wrong...";

export const ws = {
  emit: <R>(event: string, payload: any) =>
    new Promise<R>((resolve, reject) => {
      socket
        .timeout(timeout)
        .emit(event, payload, (error: Error, response: WsResponse<R>) => {
          if (error) reject(INTERNAL_SERVER_ERROR);

          if (response.ok) resolve(response.payload);
          else reject(response.msg);
        });
    }),
  on: (event: string, listener: (...args: any[]) => void) => {
    socket.off(event, listener);
    socket.on(event, listener);
  },
};
