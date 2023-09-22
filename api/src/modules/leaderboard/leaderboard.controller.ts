import {Controller, Get} from "@nestjs/common";

import {MatchPlayer} from "@modules/match";
import {User} from "@modules/user";

@Controller("/leaderboard")
export class LeaderboardController {
  @Get("/")
  async getLeaderboard() {
    const players = await User.find({order: {rating: "DESC"}});

    const leaderboard = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      const won = await MatchPlayer.count({
        where: {user: {id: player.id}, isWinner: true},
      });

      const lost = await MatchPlayer.count({
        where: {user: {id: player.id}, isWinner: false},
      });

      const played = won + lost;
      const winrate = Boolean(played) ? Math.ceil((won / played) * 100) : 0;

      const history = await MatchPlayer.find({
        where: {user: {id: player.id}},
        take: 10,
        order: {
          createdAt: "DESC",
        },
      });

      leaderboard.push({
        player,
        winrate,
        history: history.map((player) =>
          player.isWinner ? "victory" : "defeat",
        ),
      });
    }

    return {
      leaderboard: leaderboard.map(({player, winrate, history}) => ({
        ...player.public,
        winrate,
        history,
      })),
    };
  }
}
