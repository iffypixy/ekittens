import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Session,
  UseGuards,
} from "@nestjs/common";
import {SessionWithData} from "express-session";
import {Not} from "typeorm";

import {MatchPlayer, OngoingMatchService} from "@modules/match";
import {IsAuthenticatedViaHttpGuard} from "@modules/auth";
import {
  RELATIONSHIP_STATUS,
  UserService,
  Relationship,
  User,
} from "@modules/user";

@Controller("/profile")
export class ProfileController {
  constructor(
    private readonly userService: UserService,
    private readonly ongoingMatchService: OngoingMatchService,
  ) {}

  @UseGuards(IsAuthenticatedViaHttpGuard)
  @Get("/me/matches")
  async getMyMatches(@Session() session: SessionWithData) {
    const players = await MatchPlayer.find({
      where: {user: {id: session.user.id}},
      take: 5,
      order: {
        createdAt: "DESC",
      },
    });

    const matches = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      const opponents = await MatchPlayer.find({
        where: {match: {id: player.match.id}, user: {id: Not(session.user.id)}},
      });

      matches[i] = {
        ...player.match.public,
        player: player.public,
        opponents: opponents.map((opponent) => opponent.public),
        result: player.isWinner ? "victory" : "defeat",
      };
    }

    return {
      matches,
    };
  }

  @UseGuards(IsAuthenticatedViaHttpGuard)
  @Get("/me/friends")
  async getMyFriends(@Session() session: SessionWithData) {
    const relationships = await Relationship.find({
      where: [
        {user1: {id: session.user.id}, status: RELATIONSHIP_STATUS.FRIENDS},
        {user2: {id: session.user.id}, status: RELATIONSHIP_STATUS.FRIENDS},
      ],
    });

    const users = relationships.map(({user1, user2}) =>
      user1.id === session.user.id ? user2 : user1,
    );

    const friends = users.map((user) => user.public);

    return {friends};
  }

  @UseGuards(IsAuthenticatedViaHttpGuard)
  @Get("/me/stats")
  async getMyStats(@Session() session: SessionWithData) {
    const user = await User.findOne({where: {id: session.user.id}});

    const won = await MatchPlayer.count({
      where: {user: {id: session.user.id}, isWinner: true},
    });

    const lost = await MatchPlayer.count({
      where: {user: {id: session.user.id}, isWinner: false},
    });

    const played = won + lost;
    const winrate = played ? Math.ceil((won / played) * 100) : 0;

    return {
      stats: {
        won,
        lost,
        played,
        winrate,
        rating: user.rating,
      },
    };
  }

  @Get("/me")
  async getMe(@Session() session: SessionWithData) {
    return {
      user: User.create(session.user).public,
    };
  }

  @Get("/:username")
  async getUser(
    @Param("username") username: string,
    @Session() session: SessionWithData,
  ) {
    const user = await User.findOne({where: {username}});

    if (!user) throw new BadRequestException("No user found");

    const relationship = await Relationship.findOne({
      where: [
        {user1: {id: session.user.id}, user2: {id: user.id}},
        {user1: {id: user.id}, user2: {id: session.user.id}},
      ],
    });

    return {
      user: {
        ...user.public,
        relationship: relationship && relationship.public(session.user.id),
      },
    };
  }

  @Get("/:username/matches")
  async getUserMatches(@Param("username") username: string) {
    const user = await User.findOne({where: {username}});

    if (!user) throw new BadRequestException("No user found");

    const players = await MatchPlayer.find({
      where: {user: {id: user.id}},
      take: 5,
      order: {
        createdAt: "DESC",
      },
    });

    const matches = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      const opponents = await MatchPlayer.find({
        where: {match: {id: player.match.id}, user: {id: Not(user.id)}},
      });

      matches[i] = {
        ...player.match.public,
        player: player.public,
        opponents: opponents.map((opponent) => opponent.public),
        result: player.isWinner ? "victory" : "defeat",
      };
    }

    return {
      matches,
    };
  }

  @Get("/:username/friends")
  async getUserFriends(@Param("username") username: string) {
    const user = await User.findOne({where: {username}});

    if (!user) throw new BadRequestException("No user found");

    const relationships = await Relationship.find({
      where: [
        {user1: {id: user.id}, status: RELATIONSHIP_STATUS.FRIENDS},
        {user2: {id: user.id}, status: RELATIONSHIP_STATUS.FRIENDS},
      ],
    });

    const users = relationships.map(({user1, user2}) =>
      user1.id === user.id ? user2 : user1,
    );

    const friends = users.map((user) => user.public);

    return {friends};
  }

  @Get("/:username/stats")
  async getUserStats(@Param("username") username: string) {
    const user = await User.findOne({where: {username}});

    if (!user) throw new BadRequestException("No user found");

    const won = await MatchPlayer.count({
      where: {user: {id: user.id}, isWinner: true},
    });

    const lost = await MatchPlayer.count({
      where: {user: {id: user.id}, isWinner: false},
    });

    const played = won + lost;
    const winrate = played ? Math.ceil((won / played) * 100) : 0;

    return {
      stats: {won, lost, played, winrate, rating: user.rating},
    };
  }

  @UseGuards(IsAuthenticatedViaHttpGuard)
  @Get("/me/matches/ongoing")
  async getMyOngoingMatch(@Session() session: SessionWithData) {
    const user = await User.findOne({
      where: {
        username: session.user.username,
      },
    });

    if (!user) throw new BadRequestException("No user found");

    const exception = new BadRequestException("No ongoing match found");

    const interim = await this.userService.getInterim(user.id);

    const matchId = interim?.activity?.matchId || null;

    if (!matchId) throw exception;

    const match = await this.ongoingMatchService.get(matchId);

    if (!match) throw exception;

    return {
      match: match.public(user.id),
    };
  }

  @Get("/:username/matches/ongoing")
  async getOngoingMatch(@Param("username") username: string) {
    const user = await User.findOne({where: {username}});

    if (!user) throw new BadRequestException("No user found");

    const exception = new BadRequestException("No ongoing match found");

    const interim = await this.userService.getInterim(user.id);

    const matchId = interim?.activity?.matchId || null;

    if (!matchId) throw exception;

    const match = await this.ongoingMatchService.get(matchId);

    if (!match) throw exception;

    return {
      match: match.public(user.id),
    };
  }
}
