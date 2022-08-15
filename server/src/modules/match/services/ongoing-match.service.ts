import {Injectable} from "@nestjs/common";

import {RedisService, RP} from "@lib/redis";
import {OngoingMatch} from "../entities";
import {OngoingMatchData} from "../lib/typings";

@Injectable()
export class OngoingMatchService {
  constructor(private readonly redisService: RedisService) {}

  async get(id: string) {
    const data = await this.redisService.get<OngoingMatchData>(
      `${RP.MATCH}:${id}`,
    );

    if (!data) return null;

    return new OngoingMatch(data);
  }

  async save(match: OngoingMatch) {
    await this.redisService.set(`${RP.MATCH}:${match.id}`, match);
  }
}
