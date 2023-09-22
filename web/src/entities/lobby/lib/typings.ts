import {CardName} from "@entities/card";
import {User} from "@entities/user";

export interface LobbyParticipant extends User {
  as: "player" | "spectator";
  role: "leader" | "member";
}

export type LobbyModeType = "default" | "core" | "random" | "custom";

export interface LobbyMode {
  type: LobbyModeType;
  payload?: {
    disabled?: CardName[];
  };
}

export interface Lobby {
  id: string;
  participants: LobbyParticipant[];
  mode: LobbyMode;
}
