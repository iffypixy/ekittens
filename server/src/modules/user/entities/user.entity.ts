import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

import {UserPublic} from "../lib/typings";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 16,
    unique: true,
  })
  username: string;

  @Column({
    type: "varchar",
    length: 50,
  })
  password: string;

  @Column({
    type: "int",
    default: 1000,
  })
  rating: number;

  get public(): UserPublic {
    const {id, username, rating} = this;

    return {
      id,
      username,
      rating,
    };
  }
}
