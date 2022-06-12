import {ws} from "@shared/lib/websocket";

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

const create = (data: CreateLobbyData) =>
  ws.emit<CreateLobbyOutput>(lobbyEvents.server.CREATE, data);

export interface JoinLobbyData {
  username: string;
  avatar: number;
  lobbyId: string;
}

export interface JoinLobbyOutput {
  lobby: Lobby;
}

const join = (data: JoinLobbyData): Promise<JoinLobbyOutput> =>
  ws.emit(lobbyEvents.server.JOIN, data);

export interface KickLobbyPlayerData {
  lobbyId: string;
  playerId: string;
}

const kickPlayer = (data: KickLobbyPlayerData): Promise<void> =>
  ws.emit(lobbyEvents.server.KICK_PLAYER, data);

export interface LeaveLobbyData {
  lobbyId: string;
}

const leave = (data: LeaveLobbyData): Promise<void> =>
  ws.emit(lobbyEvents.server.LEAVE, data);

export const lobbyApi = {
  create,
  join,
  kickPlayer,
  leave,
};
