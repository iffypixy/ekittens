import {User} from "@modules/user";
import {LobbyParticipantData} from "../lib/typings";

export class LobbyParticipant {
  user: User;
  as: "player" | "spectator";
  role: "leader" | "member";

  constructor(participant: LobbyParticipantData) {
    this.user = User.create(participant.user);
    this.as = participant.as;
    this.role = participant.role;
  }

  get public() {
    const {user, role, as} = this;

    return {...user.public, role, as};
  }
}
