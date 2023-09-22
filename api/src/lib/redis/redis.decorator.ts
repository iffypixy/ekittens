import {Inject} from "@nestjs/common";

import {REDIS_PROVIDER_TOKEN} from "./lib/constants";

export const InjectRedis = (): ParameterDecorator => {
  return Inject(REDIS_PROVIDER_TOKEN);
};
