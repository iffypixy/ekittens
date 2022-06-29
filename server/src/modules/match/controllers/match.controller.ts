import {
  BadRequestException,
  Controller,
  Get,
  Session,
  UseGuards,
} from "@nestjs/common";
import {Sess} from "express-session";
import {Redis} from "ioredis";

import {IsAuthenticatedGuard} from "@modules/auth";
import {InjectRedis, REDIS_PREFIX} from "@lib/redis";
import {MatchPlayerService} from "../services";
import {plain} from "../lib/plain";
import {OngoingMatch, OngoingMatchPublic} from "../lib/typings";

@UseGuards(IsAuthenticatedGuard)
@Controller("/matches")
export class MatchController {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly matchPlayerService: MatchPlayerService,
  ) {}

  @Get("/ongoing")
  async getOngoingMatch(
    @Session() session: Sess,
  ): Promise<{match: OngoingMatchPublic}> {
    const player = await this.matchPlayerService.findOne({
      where: {
        user: session.user,
        match: {status: "ongoing"},
      },
    });

    const exception = new BadRequestException("No ongoing match found");

    if (!player) throw exception;

    const matchJSON = await this.redis.get(
      `${REDIS_PREFIX.MATCH}:${player.match.id}`,
    );
    const match: OngoingMatch = JSON.parse(matchJSON) || null;

    if (!match) throw exception;

    return {
      match: plain.match(match),
    };
  }
}
