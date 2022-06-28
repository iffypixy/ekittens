import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

export interface UserPublic {
  id: string;
  username: string;
}

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
    const {id, username} = this;

    return {
      id,
      username,
    };
  }
}
