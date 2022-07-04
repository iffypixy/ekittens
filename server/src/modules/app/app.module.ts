import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";

import {redisConfig, databaseConfig} from "@config/index";
import {RedisModule} from "@lib/redis";
import {AuthModule} from "@modules/auth";
import {User, UserModule} from "@modules/user";
import {MatchModule} from "@modules/match";
import {ProfileModule} from "@modules/profile";
import {AppGateway} from "./app.gateway";

const env = process.env.NODE_ENV || "development";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${env}`,
      load: [redisConfig, databaseConfig],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>("redis.host"),
        port: configService.get<number>("redis.port"),
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
        entities: [User],
      }),
    }),
    AuthModule,
    UserModule,
    MatchModule,
    ProfileModule,
  ],
  providers: [AppGateway],
})
export class AppModule {}
