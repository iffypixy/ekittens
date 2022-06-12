import {FactoryProvider, ModuleMetadata} from "@nestjs/common/interfaces";
import {RedisOptions} from "ioredis";

export type RedisAsyncModuleOptions = {
  useFactory: (...args: any[]) => RedisOptions;
} & Pick<ModuleMetadata, "imports"> &
  Pick<FactoryProvider, "inject">;
