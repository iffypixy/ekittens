import {IsString} from "class-validator";

export class UnblockDto {
  @IsString({message: "User id must be a type of string"})
  userId: string;
}
