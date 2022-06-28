import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

import {User} from "@modules/user";
import {Match} from "./match.entity";

@Entity()
export class MatchPlayer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Match)
  match: Match;

  @Column({
    type: "boolean",
  })
  isWinner: boolean;

  @Column({
    type: "number",
  })
  rating: number;

  @Column({
    type: "number",
    nullable: true,
  })
  ratingShift: number;
}
