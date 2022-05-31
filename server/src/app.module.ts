import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {BullModule} from "@nestjs/bull";

import {redisConfig} from "@config/index";
import {MatchModule} from "@modules/match";
import {LobbyModule} from "@modules/lobby";

const env = process.env.NODE_ENV || "development";

@Module({
  imports: [
    LobbyModule,
    MatchModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${env}`,
      load: [redisConfig],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (service: ConfigService) => ({
        redis: {
          host: service.get("redis.host"),
          port: service.get("redis.port"),
        },
      }),
    }),
  ],
})
export class AppModule {}
