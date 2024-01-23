import {Injectable} from "@nestjs/common";

import {RedisService, RP} from "@lib/redis";
import {UserInterim, UserSupplemental} from "../lib/typings";

@Injectable()
export class UserService {
  constructor(private readonly redisService: RedisService) {}

  async getSupplemental(id: string): Promise<UserSupplemental> {
    const interim = await this.getInterim(id);

    return {
      status: interim?.status || "offline",
      activity: interim?.activity || null,
    };
  }

  async getInterim(id: string): Promise<UserInterim> {
    return this.redisService.get(`${RP.USER}:${id}`);
  }

  async setInterim(id: string, interim: UserInterim): Promise<void> {
    await this.redisService.update(`${RP.USER}:${id}`, interim);
  }
}
