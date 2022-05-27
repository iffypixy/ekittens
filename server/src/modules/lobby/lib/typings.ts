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
