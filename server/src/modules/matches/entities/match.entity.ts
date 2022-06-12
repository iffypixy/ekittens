import {Column, Entity, OneToOne, PrimaryGeneratedColumn} from "typeorm";

import {MatchParticipant} from "./match-participant.entity";

@Entity()
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => MatchParticipant)
  winner: MatchParticipant;

  @Column({
    type: "jsonb",
    length: 4096,
  })
  history: string;
}
