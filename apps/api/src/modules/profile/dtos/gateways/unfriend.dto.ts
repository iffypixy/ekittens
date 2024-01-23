import {IsString} from "class-validator";

export class UnfriendDto {
  @IsString({message: "User id must be a type of string"})
  userId: string;
}
