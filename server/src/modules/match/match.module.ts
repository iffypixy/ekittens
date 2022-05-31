import {Module} from "@nestjs/common";
import {BullModule} from "@nestjs/bull";

import {MatchGateway} from "./match.gateway";

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: "inactive",
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
      {
        name: "explosion",
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
      {
        name: "favor-response",
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
      {
        name: "play",
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
      {
        name: "spot-response",
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
      },
    ),
  ],
  providers: [MatchGateway],
})
export class MatchModule {}
