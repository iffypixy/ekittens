import {MiddlewareConsumer, Module, NestModule} from "@nestjs/common";

import {MatchModule} from "@modules/match";
import {UserModule} from "@modules/user";
import {AuthMiddleware} from "@modules/auth";
import {ProfileController} from "./profile.controller";
import {ProfileGateway} from "./profile.gateway";

@Module({
  imports: [UserModule, MatchModule],
  providers: [ProfileGateway],
  controllers: [ProfileController],
})
export class ProfileModule {}

// implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(AuthMiddleware).forRoutes(ProfileController);
//   }
// }
