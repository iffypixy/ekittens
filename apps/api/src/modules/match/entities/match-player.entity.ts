import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import {User} from "@modules/user";
import {Match} from "./match.entity";

@Entity()
export class MatchPlayer extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  user: User;

  @ManyToOne(() => Match, {
    eager: true,
  })
  match: Match;

  @Column({
    type: "boolean",
    nullable: true,
  })
  isWinner: boolean;

  @Column({
    type: "int",
  })
  rating: number;

  @Column({
    type: "int",
    nullable: true,
  })
  shift: number;

  @CreateDateColumn()
  createdAt: Date;

  get public() {
    const {user, rating, shift} = this;

    return {
      user: user.public,
      rating,
      shift,
    };
  }
}
