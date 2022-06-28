import {Entity, Column, PrimaryColumn} from "typeorm";

import {MatchType} from "../lib/typings";
import {MATCH_TYPES} from "../lib/constants";

type MatchStatus = "ongoing" | "completed";

const MATCH_STATUSES: MatchStatus[] = ["ongoing", "completed"];

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
