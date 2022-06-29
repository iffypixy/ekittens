import {MiddlewareConsumer, Module, NestModule} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {BullModule, BullModuleOptions} from "@nestjs/bull";
import Bull from "bull";

import {UserModule} from "@modules/user";
import {AuthMiddleware} from "@modules/auth";
import {MatchController} from "./controllers";
import {MatchPlayerService, MatchService} from "./services";
import {MatchGateway, PublicMatchGateway} from "./gateways";
import {Match, MatchPlayer} from "./entities";
import {QUEUE} from "./lib/constants";

const jobOptions: Bull.JobOptions = {
  removeOnComplete: true,
  removeOnFail: true,
};

const queues = [...Object.values(QUEUE)].map((queue) => queue.NAME);

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
    UserModule,
  ],
  providers: [
    MatchGateway,
    PublicMatchGateway,
    MatchService,
    MatchPlayerService,
  ],
  controllers: [MatchController],
})
export class MatchModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes(MatchController);
  }
}
