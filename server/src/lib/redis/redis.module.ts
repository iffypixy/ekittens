import {DynamicModule, Provider} from "@nestjs/common";
import {Module} from "@nestjs/common";
import Redis from "ioredis";

import {RedisAsyncModuleOptions} from "./redis.interface";
import {REDIS_PROVIDER_TOKEN} from "./redis.constants";

@Module({})
export class RedisModule {
  static async forRootAsync(
    options: RedisAsyncModuleOptions,
  ): Promise<DynamicModule> {
    const providers: Provider[] = [];

    providers.push({
      provide: REDIS_PROVIDER_TOKEN,
      inject: options.inject,
      useFactory: async (...args) => {
        const opts = await options.useFactory(...args);

        return new Redis(opts);
      },
    });

    return {
      global: true,
      module: RedisModule,
      imports: options.imports,
      providers,
      exports: providers,
    };
  }
}
