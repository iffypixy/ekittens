import {LobbyParticipant} from "./lobby-participant.entity";
import {LobbyData, LobbyMode, LobbyParticipantData} from "../lib/typings";

export class Lobby {
  id: string;
  participants: LobbyParticipant[];
  mode: LobbyMode;

  constructor(lobby: LobbyData) {
    this.id = lobby.id;
    this.participants = lobby.participants.map((p) => new LobbyParticipant(p));
    this.mode = lobby.mode;
  }

  public addParticipant(data: LobbyParticipantData) {
    this.participants.push(new LobbyParticipant(data));
  }

  get public() {
    const {id, participants, mode} = this;

    return {
      id,
      participants: participants.map((participant) => participant.public),
      mode,
    };
  }
}
