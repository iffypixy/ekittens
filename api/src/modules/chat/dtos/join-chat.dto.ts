import {IsString} from "class-validator";

export class JoinChatDto {
  @IsString({message: "Chat ID must be type of a string"})
  chatId: string;
}
