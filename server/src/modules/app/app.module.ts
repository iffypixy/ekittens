import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {BullModule} from "@nestjs/bull";

import {redisConfig, databaseConfig, s3Config} from "@config/index";
import {RedisModule} from "@lib/redis";
import {AuthModule} from "@modules/auth";
import {Relationship, User, UserModule} from "@modules/user";
import {Match, MatchModule, MatchPlayer} from "@modules/match";
import {ProfileModule} from "@modules/profile";
import {LeaderboardModule} from "@modules/leaderboard";
import {ChatModule} from "@modules/chat";
import {AppGateway} from "./app.gateway";

const env = process.env.NODE_ENV || "development";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${env}`,
      load: [redisConfig, databaseConfig, s3Config],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>("redis.host"),
        port: configService.get<number>("redis.port"),
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>("redis.host"),
          port: configService.get<number>("redis.port"),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("db.host"),
        port: configService.get<number>("db.port"),
        username: configService.get<string>("db.username"),
        password: configService.get<string>("db.password"),
        database: configService.get<string>("db.name"),
        synchronize: configService.get<boolean>("db.synchronize"),
        entities: [User, Match, MatchPlayer, Relationship],
      }),
    }),
    AuthModule,
    UserModule,
    MatchModule,
    ProfileModule,
    LeaderboardModule,
    ChatModule,
  ],
  providers: [AppGateway],
})
export class AppModule {}
