import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";

import {Relationship, User} from "./entities";
import {UserService, RelationshipService} from "./services";

@Module({
  imports: [TypeOrmModule.forFeature([User, Relationship])],
  providers: [UserService, RelationshipService],
  exports: [UserService],
})
export class UserModule {}
