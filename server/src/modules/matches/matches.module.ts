import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {BullModule, BullModuleOptions} from "@nestjs/bull";

import {MatchmakingGateway} from "./gateways";
import {Match, MatchPlayer} from "./entities";
import {QUEUES} from "./matches.constants";

const jobOptions = {
  removeOnComplete: true,
  removeOnFail: true,
};

const queues = [
  QUEUES.MATCHMAKING,
  QUEUES.CARD_ACTION,
  QUEUES.COMBO_ACTION,
  QUEUES.INACTIVE,
  QUEUES.FAVOR,
  QUEUES.EXPLODING_KITTEN_DEFUSE,
  QUEUES.EXPLODING_KITTEN_INSERTION,
  QUEUES.PILE_CARD_DRAW,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchPlayer]),
    BullModule.registerQueue(
      ...queues.map(
        (queue): BullModuleOptions => ({
          name: queue,
          defaultJobOptions: jobOptions,
        }),
      ),
    ),
  ],
  providers: [MatchmakingGateway],
})
export class MatchesModule {}
