import {NestFactory} from "@nestjs/core";

import {ClusterService} from "@lib/cluster";
import {WebSocketAdapter} from "@lib/websocket";
import {AppModule} from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: process.env.CLIENT_ORIGIN,
    },
  });

  app.useWebSocketAdapter(new WebSocketAdapter(app, true));

  await app.listen(5000);
}

bootstrap();

// ClusterService.clusterize(bootstrap);
