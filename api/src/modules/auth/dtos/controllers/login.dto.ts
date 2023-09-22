import {IsString} from "class-validator";

export class LoginDto {
  @IsString({
    message: "Username must be a type of string",
  })
  username: string;

  @IsString({
    message: "Password must be a type of string",
  })
  password: string;
}
