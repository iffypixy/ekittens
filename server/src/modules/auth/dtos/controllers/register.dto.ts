import {IsString, Matches, Max, Min} from "class-validator";

import {regex} from "@lib/regex";

export class RegisterDto {
  @IsString({
    message: "Username must be a type of string",
  })
  @Matches(regex.username, {
    message: "Username must be valid",
  })
  @Min(4, {
    message: "Username must contain at least 4 characters",
  })
  @Max(16, {
    message: "Username must contain at most 16 characters",
  })
  username: string;

  @IsString({
    message: "Password must be a type of string",
  })
  @Min(8, {
    message: "Password must contain at least 8 characters",
  })
  @Max(50, {
    message: "Password must contain at most 50 characters",
  })
  password: string;
}
