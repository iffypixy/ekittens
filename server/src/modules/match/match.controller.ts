import {
  BadRequestException,
  Controller,
  Get,
  Session,
  UseGuards,
} from "@nestjs/common";
import {Sess} from "express-session";

import {IsAuthenticatedGuard} from "@modules/auth";
import {UserInterim} from "@modules/user";
import {RedisService, RP} from "@lib/redis";
import {plain} from "./lib/plain";
import {OngoingMatch, OngoingMatchPublic} from "./lib/typings";

@UseGuards(IsAuthenticatedGuard)
@Controller("/matches")
export class MatchController {
  constructor(private readonly redisService: RedisService) {}

  @Get("/ongoing")
  async getOngoingMatch(
    @Session() session: Sess,
  ): Promise<{match: OngoingMatchPublic}> {
    const exception = new BadRequestException("No ongoing match found");

    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${session.user.id}`,
    );

    if (!interim) throw exception;

    const match = await this.redisService.get<OngoingMatch>(
      `${RP.MATCH}:${interim.matchId}`,
    );

    if (!match) throw exception;

    return {
      match: plain.match(match),
    };
  }
}
