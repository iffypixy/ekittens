import {NestFactory} from "@nestjs/core";

import {session} from "@lib/session";
import {ClusterService} from "@lib/cluster";
import {AppModule} from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: process.env.CLIENT_ORIGIN,
    },
  });

  app.use(session());

  await app.listen(5000);
}

ClusterService.clusterize(bootstrap);
