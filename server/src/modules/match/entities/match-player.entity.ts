import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

import {User} from "@modules/user";
import {Match} from "./match.entity";
import {MatchPlayerPublic} from "../lib/typings";

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
    nullable: true,
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

  get public(): MatchPlayerPublic {
    const {user, isWinner, rating, ratingShift} = this;

    return {
      ...user.public,
      isWinner,
      rating,
      ratingShift,
    };
  }
}
