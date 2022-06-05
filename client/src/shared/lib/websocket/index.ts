import {io} from "socket.io-client";

// https://api.ekittens.lol

export const socket = io("http://localhost:5000", {
  withCredentials: true,
});
