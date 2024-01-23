import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import {RELATIONSHIP_STATUS, RELATIONSHIP_STATUSES} from "../lib/constants";
import {User} from "./user.entity";

@Entity()
export class Relationship extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  user1: User;

  @ManyToOne(() => User, {
    eager: true,
  })
  user2: User;

  @Column({
    enum: RELATIONSHIP_STATUSES,
  })
  status: number;

  public(id: string) {
    const {user1, user2, status} = this;

    const unidirectional = {
      FRIEND_REQ_SENT: 0,
      FRIEND_REQ_RECEIVED: 1,
      FRIENDS: 2,
      NONE: 3,
    };

    if (status === RELATIONSHIP_STATUS.NONE) return unidirectional.NONE;

    if (status === RELATIONSHIP_STATUS.FRIENDS) return unidirectional.FRIENDS;

    const isUser1 = user1.id === id;
    const isUser2 = user2.id === id;

    if (status === RELATIONSHIP_STATUS.FRIEND_REQ_1_2) {
      if (isUser1) return unidirectional.FRIEND_REQ_SENT;
      if (isUser2) return unidirectional.FRIEND_REQ_RECEIVED;
    }

    if (status === RELATIONSHIP_STATUS.FRIEND_REQ_2_1) {
      if (isUser1) return unidirectional.FRIEND_REQ_RECEIVED;
      if (isUser2) return unidirectional.FRIEND_REQ_SENT;
    }
  }
}
