import {ack} from "@lib/ws";
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";

import {GetSupplementalDto} from "../dtos/gateways";
import {events} from "../lib/events";
import {UserSupplemental} from "../lib/typings";
import {UserService} from "../services";

@WebSocketGateway()
export class UserGateway {
  constructor(private readonly userService: UserService) {}

  @SubscribeMessage(events.server.GET_SUPPLEMENTAL)
  async getSupplemental(@MessageBody() dto: GetSupplementalDto) {
    const supplementals: Record<string, UserSupplemental> = {};

    for (let i = 0; i < dto.ids.length; i++) {
      const id = dto.ids[i];

      const supplemental = await this.userService.getSupplemental(id);

      supplementals[id] = supplemental;
    }

    return ack({ok: true, payload: {supplementals}});
  }
}
