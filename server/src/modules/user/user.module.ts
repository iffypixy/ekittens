import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";

import {Relationship, User} from "./entities";
import {UserService} from "./services";
import {UserGateway} from "./gateways";

@Module({
  imports: [TypeOrmModule.forFeature([User, Relationship])],
  providers: [UserService, UserGateway],
  exports: [UserService],
})
export class UserModule {}
