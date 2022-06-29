import {Server, Socket} from "socket.io";

export class WsHelper {
  constructor(private readonly server: Server) {}

  getSocketsInRoomByUserId(room: string, id: string): Socket[] {
    const namespace = this.server.of("/");

    const ids = Array.from(namespace.adapter.rooms.get(room));

    const sockets = ids.map(this.getSocketById);

    return sockets.filter((socket) => socket.request.session.user.id === id);
  }

  getSocketsByUserId(id: string): Socket[] {
    const namespace = this.server.of("/");

    const sockets = Array.from(namespace.sockets.values());

    return sockets.filter((socket) => socket.request.session.user.id === id);
  }

  getSocketById(id: string): Socket {
    const namespace = this.server.of("/");

    return namespace.sockets.get(id);
  }
}
