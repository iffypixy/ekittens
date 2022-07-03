import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";

import {Relationship, User} from "./entities";
import {UserService, RelationshipService} from "./services";
import {UserGateway} from "./user.gateway";

@Module({
  imports: [TypeOrmModule.forFeature([User, Relationship])],
  providers: [UserService, RelationshipService, UserGateway],
  exports: [UserService],
})
export class UserModule {}
