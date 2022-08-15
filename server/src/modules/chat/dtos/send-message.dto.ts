import {IsString} from "class-validator";

export class SendMessageDto {
  @IsString({message: "Chat ID must be type of a string"})
  chatId: string;

  @IsString({message: "Text must be type of a string"})
  text: string;
}
