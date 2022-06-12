import {Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

import {User} from "@modules/users";
import {Match} from "./match.entity";

@Entity()
export class MatchParticipant {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Match)
  match: Match;
}
