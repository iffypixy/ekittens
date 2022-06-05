import {io} from "socket.io-client";

// https://api.ekittens.lol

export const socket = io("https://api.ekittens.lol", {
  withCredentials: true,
});
