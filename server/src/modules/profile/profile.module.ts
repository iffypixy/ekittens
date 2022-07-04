import {Module} from "@nestjs/common";

import {MatchModule} from "@modules/match";
import {UserModule} from "@modules/user";
import {ProfileController} from "./profile.controller";
import {ProfileGateway} from "./profile.gateway";

@Module({
  imports: [UserModule, MatchModule],
  providers: [ProfileGateway],
  controllers: [ProfileController],
})
export class ProfileModule {}
