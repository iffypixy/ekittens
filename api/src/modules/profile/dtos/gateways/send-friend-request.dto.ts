import {IsString} from "class-validator";

export class SendFriendRequestDto {
  @IsString({message: "User id must be a type of string"})
  userId: string;
}
