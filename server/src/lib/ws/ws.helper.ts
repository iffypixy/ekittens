import {Server, Socket} from "socket.io";

export class WsHelper {
  constructor(private readonly server: Server) {}

  getAllSockets(): Socket[] {
    return Array.from(this.server.of("/").sockets.values());
  }

  getSocketsByUserId(id: string): Socket[] {
    const sockets = Array.from(this.server.of("/").sockets.values());

    return sockets.filter((socket) => socket.request.session.user.id === id);
  }
}
