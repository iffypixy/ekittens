import {IsString} from "class-validator";

export class GetSupplementalDto {
  @IsString({message: "Id must be a type of string", each: true})
  ids: string[];
}
