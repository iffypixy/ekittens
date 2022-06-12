import {NestFactory} from "@nestjs/core";
import {Redis} from "ioredis";

import {clusterize} from "@lib/cluster";
import {WebSocketAdapter} from "@lib/ws";
import {REDIS_PROVIDER_TOKEN} from "@lib/redis";
import {session} from "@lib/session";
import {AppModule} from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: process.env.CLIENT_ORIGIN,
    },
  });

  const redis: Redis = app.get(REDIS_PROVIDER_TOKEN);

  app.use(session(redis));

  app.useWebSocketAdapter(new WebSocketAdapter(app, true));

  await app.listen(5000);
}

clusterize(bootstrap);
