import {Column, Entity, PrimaryGeneratedColumn, BaseEntity} from "typeorm";

@Entity()
export class User extends BaseEntity {
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
    length: 256,
  })
  password: string;

  @Column({
    type: "varchar",
    length: 512,
  })
  avatar: string;

  @Column({
    type: "int",
    default: 1000,
  })
  rating: number;

  get public() {
    const {id, username, avatar, rating} = this;

    return {id, username, avatar, rating};
  }
}
