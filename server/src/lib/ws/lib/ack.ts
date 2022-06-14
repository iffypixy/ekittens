export interface WsResponse {
  ok: boolean;
  msg?: string;
  payload?: any;
}

export interface WsFulfilled extends Omit<WsResponse, "msg"> {
  ok: true;
}

export interface WsRejected extends Omit<WsResponse, "payload"> {
  ok: false;
}

export const ack = (res: WsFulfilled | WsRejected) => res;
