import {Entity, Column, PrimaryColumn} from "typeorm";

import {MatchStatus, MatchType} from "../lib/typings";
import {MATCH_TYPES, MATCH_STATUSES} from "../lib/constants";

@Entity()
export class Match {
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
}
