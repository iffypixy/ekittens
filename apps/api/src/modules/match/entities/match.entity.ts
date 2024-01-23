import {
  Entity,
  Column,
  PrimaryColumn,
  BaseEntity,
  CreateDateColumn,
} from "typeorm";

import {MatchStatus, MatchType} from "../lib/typings";
import {MATCH_TYPES, MATCH_STATUSES} from "../lib/constants";

@Entity()
export class Match extends BaseEntity {
  @PrimaryColumn()
  id: string;

  @Column({
    enum: MATCH_TYPES,
  })
  type: MatchType;

  @Column({
    enum: MATCH_STATUSES,
  })
  status: MatchStatus;

  @CreateDateColumn()
  createdAt: Date;

  get public() {
    const {id, type, status, createdAt} = this;

    return {id, type, status, createdAt};
  }
}
