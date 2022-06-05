import {io} from "socket.io-client";

export const socket = io("https://api.ekittens.lol", {
  withCredentials: true,
});
