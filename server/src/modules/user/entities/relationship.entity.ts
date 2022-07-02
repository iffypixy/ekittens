import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

import {RELATIONSHIP_STATUSES} from "../lib/constants";
import {RelationshipStatus} from "../lib/typings";
import {User} from "./user.entity";

@Entity()
export class Relationship {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User)
  user1: User;

  @ManyToOne(() => User)
  user2: User;

  @Column({
    enum: RELATIONSHIP_STATUSES,
  })
  status: RelationshipStatus;
}
