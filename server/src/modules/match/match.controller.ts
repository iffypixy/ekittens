import {Controller, Get, Session, UseGuards} from "@nestjs/common";
import {Sess} from "express-session";

import {IsAuthenticatedGuard} from "@modules/auth";
import {RedisService, RP} from "@lib/redis";
import {Enqueued} from "./lib/typings";

@UseGuards(IsAuthenticatedGuard)
@Controller("/matches")
export class MatchController {
  constructor(private readonly redisService: RedisService) {}

  @Get("/queue/status")
  async getQueueStatus(@Session() session: Sess) {
    const queue = (await this.redisService.get<Enqueued[]>(RP.QUEUE)) || [];

    const enqueued = queue.find((enqueued) => enqueued.id === session.user.id);

    if (enqueued) return {isEnqueued: true, enqueuedAt: enqueued.at};

    return {
      isEnqueued: false,
    };
  }
}
