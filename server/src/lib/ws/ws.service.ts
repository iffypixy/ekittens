import {Server, Socket} from "socket.io";

export class WsService {
  constructor(private readonly server: Server) {}

  public getSocketById(id: string): Socket {
    const global = this.server.of("/");

    return global.sockets.get(id);
  }

  public getSocketsByUserId(id: string, options?: {room: string}): Socket[] {
    const global = this.server.of("/");

    let sockets = Array.from(global.sockets.values());

    const room = options && options.room;

    if (room) {
      const ids = Array.from(global.adapter.rooms.get(room));

      sockets = ids.map(this.getSocketById);
    }

    return sockets.filter((socket) => socket.request.session.user.id === id);
  }
}
