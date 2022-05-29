import {socket} from "@shared/lib/websocket";

export const lobbyEvents = {
  server: {
    CREATE: "lobby:create",
    JOIN: "lobby:join",
    KICK_PLAYER: "lobby:kick-player",
    LEAVE: "lobby:leave",
  },
  client: {
    PLAYER_JOINED: "lobby:player-joined",
  },
};

export interface LobbyPlayer {
  id: string;
  username: string;
  avatar: number;
  role: "owner" | "member";
}

export interface Lobby {
  id: string;
  players: LobbyPlayer[];
}

export interface CreateLobbyData {
  username: string;
  avatar: number;
}

export interface CreateLobbyOutput {
  lobby: Lobby;
}

const create = (data: CreateLobbyData): Promise<CreateLobbyOutput> =>
  new Promise((resolve) => {
    socket.emit(lobbyEvents.server.CREATE, data, resolve);
  });

export interface JoinLobbyData {
  username: string;
  avatar: number;
  lobbyId: string;
}

export interface JoinLobbyOutput {
  lobby: Lobby;
}

const join = (data: JoinLobbyData): Promise<JoinLobbyOutput> =>
  new Promise((resolve) => {
    socket.emit(lobbyEvents.server.JOIN, data, resolve);
  });

export interface KickLobbyPlayerData {
  lobbyId: string;
  playerId: string;
}

const kickPlayer = (data: KickLobbyPlayerData): Promise<void> =>
  new Promise((resolve) =>
    socket.emit(lobbyEvents.server.KICK_PLAYER, data, resolve),
  );

export interface LeaveLobbyData {
  lobbyId: string;
}

const leave = (data: LeaveLobbyData): Promise<void> =>
  new Promise((resolve) =>
    socket.emit(lobbyEvents.server.LEAVE, data, resolve),
  );

export const lobbyApi = {
  create,
  join,
  kickPlayer,
  leave,
};
