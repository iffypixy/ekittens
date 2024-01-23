import {IsString} from "class-validator";

export class VerifyUsernameDto {
  @IsString({
    message: "Username must be a type of string",
  })
  username: string;
}
