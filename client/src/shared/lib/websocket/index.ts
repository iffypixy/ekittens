import {io} from "socket.io-client";

export const socket = io("https://ekittens.lol", {
  withCredentials: true,
});
