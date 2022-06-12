import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";

import {Match, MatchParticipant} from "./entities";

@Module({
  imports: [TypeOrmModule.forFeature([Match, MatchParticipant])],
})
export class MatchesModule {}
