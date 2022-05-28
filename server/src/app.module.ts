import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {BullModule} from "@nestjs/bull";

import {redisConfig} from "@config/index";
import {MatchModule} from "@modules/match";

const env = process.env.NODE_ENV || "development";

@Module({
  imports: [
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
          host: service.get("host"),
          port: service.get("redis.port"),
        },
      }),
    }),
  ],
})
export class AppModule {}
