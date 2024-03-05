import {Controller, Get, Session, UseGuards} from "@nestjs/common";
import {SessionWithData} from "express-session";

import {IsAuthenticatedViaHttpGuard} from "@modules/auth";
import {RedisService, RP} from "@lib/redis";

import {Enqueued} from "./lib/typings";

@UseGuards(IsAuthenticatedViaHttpGuard)
@Controller("/matches")
export class MatchController {
  constructor(private readonly redisService: RedisService) {}

  @Get("/queue/status")
  async getQueueStatus(@Session() session: SessionWithData) {
    const queue = (await this.redisService.get<Enqueued[]>(RP.QUEUE)) || [];

    const enqueued = queue.find((enqueued) => enqueued.id === session.user.id);

    if (enqueued) return {isEnqueued: true, enqueuedAt: enqueued.at};

    return {
      isEnqueued: false,
    };
  }
}
