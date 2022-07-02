import {IsString} from "class-validator";

export class AcceptFriendRequestDto {
  @IsString({message: "User id must be a type of string"})
  userId: string;
}
