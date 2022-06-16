import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "typeorm";

import {MatchPlayer} from "./match-player.entity";

@Entity()
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => MatchPlayer)
  winner: MatchPlayer;

  @Column({
    type: "jsonb",
    length: 4096,
  })
  history: string;
}
