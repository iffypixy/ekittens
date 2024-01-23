import {Injectable} from "@nestjs/common";

import {RedisService, RP} from "@lib/redis";
import {LobbyData} from "../lib/typings";
import {Lobby} from "../entities";

@Injectable()
export class LobbyService {
  constructor(private readonly redisService: RedisService) {}

  async get(id: string) {
    const data = await this.redisService.get<LobbyData>(`${RP.LOBBY}:${id}`);

    if (!data) return null;

    return new Lobby(data);
  }

  async save(lobby: Lobby) {
    await this.redisService.set(`${RP.LOBBY}:${lobby.id}`, lobby);
  }

  async delete(id: string) {
    await this.redisService.delete(`${RP.LOBBY}:${id}`);
  }
}
