import {IsString} from "class-validator";

export class RevokeFriendRequestDto {
  @IsString({message: "User id must be a type of string"})
  userId: string;
}
