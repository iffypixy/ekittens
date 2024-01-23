import {Module} from "@nestjs/common";

import {UserModule} from "@modules/user";
import {MatchModule} from "@modules/match";
import {LeaderboardController} from "./leaderboard.controller";

@Module({
  imports: [UserModule, MatchModule],
  controllers: [LeaderboardController],
})
export class LeaderboardModule {}
