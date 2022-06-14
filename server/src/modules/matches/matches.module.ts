import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {BullModule} from "@nestjs/bull";

import {Match, MatchParticipant} from "./entities";

const jobOptions = {
  removeOnComplete: true,
  removeOnFail: true,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchParticipant]),
    BullModule.registerQueue({
      name: "matchmaking",
      defaultJobOptions: jobOptions,
    }),
  ],
})
export class MatchesModule {}
