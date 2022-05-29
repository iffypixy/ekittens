import {Module} from "@nestjs/common";

import {LobbyGateway} from "./lobby.gateway";

@Module({
  providers: [LobbyGateway],
})
export class LobbyModule {}
