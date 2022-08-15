import {LobbyParticipant} from "./lobby-participant.entity";
import {Card, LobbyData, LobbyParticipantData} from "../lib/typings";

export class Lobby {
  id: string;
  participants: LobbyParticipant[];
  disabled: Card[];

  constructor(lobby: LobbyData) {
    this.id = lobby.id;
    this.participants = lobby.participants.map((p) => new LobbyParticipant(p));
    this.disabled = lobby.disabled;
  }

  public addParticipant(data: LobbyParticipantData) {
    this.participants.push(new LobbyParticipant(data));
  }

  get public() {
    const {id, participants, disabled} = this;

    return {
      id,
      participants: participants.map((participant) => participant.public),
      disabled,
    };
  }
}
