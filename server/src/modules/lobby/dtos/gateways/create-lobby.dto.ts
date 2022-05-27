import {IsNumberString, IsString} from "class-validator";

export class CreateLobbyDto {
  @IsString({
    message: "Username must be a type of string",
  })
  username: string;

  @IsNumberString(null, {
    message: "Avatar must be a type of number",
  })
  avatar: number;
}
