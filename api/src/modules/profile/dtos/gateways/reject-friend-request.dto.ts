import {IsString} from "class-validator";

export class RejectFriendRequestDto {
  @IsString({message: "User id must be a type of string"})
  userId: string;
}
