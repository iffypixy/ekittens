import {DynamicModule, Provider} from "@nestjs/common";
import {Module} from "@nestjs/common";
import Redis from "ioredis";

import {RedisService} from "./redis.service";
import {RedisAsyncModuleOptions} from "./lib/typings";
import {REDIS_PROVIDER_TOKEN} from "./lib/constants";

@Module({})
export class RedisModule {
  static async forRootAsync(
    options: RedisAsyncModuleOptions,
  ): Promise<DynamicModule> {
    const providers: Provider[] = [];

    providers.push({
      provide: REDIS_PROVIDER_TOKEN,
      inject: options.inject,
      useFactory: (...args) => {
        const opts = options.useFactory(...args);

        return new Redis(opts);
      },
    });

    providers.push(RedisService);

    return {
      global: true,
      module: RedisModule,
      imports: options.imports,
      providers,
      exports: providers,
    };
  }
}
