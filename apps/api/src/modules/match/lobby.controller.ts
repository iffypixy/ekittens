import {Controller, Get, Session, UseGuards} from "@nestjs/common";
import {Sess} from "express-session";

import {IsAuthenticatedGuard} from "@modules/auth";
import {RedisService} from "@lib/redis";
import {UserService} from "@modules/user";
import {LobbyService} from "./services";

@UseGuards(IsAuthenticatedGuard)
@Controller("/lobbies")
export class LobbyController {
  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    private readonly lobbyService: LobbyService,
  ) {}

  @Get("/current")
  async getCurrentLobby(@Session() session: Sess) {
    const interim = await this.userService.getInterim(session.user.id);

    const lobby = await this.lobbyService.get(interim.activity?.lobbyId);

    return {
      lobby: lobby ? lobby.public : null,
    };
  }
}
