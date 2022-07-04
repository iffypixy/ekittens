import {Entity, Column, PrimaryColumn} from "typeorm";

import {MatchPublic, MatchStatus, MatchType} from "../lib/typings";
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

  get public(): MatchPublic {
    const {id, type, status} = this;

    return {id, type, status};
  }
}
