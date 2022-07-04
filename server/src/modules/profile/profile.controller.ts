import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Session,
} from "@nestjs/common";
import {Sess} from "express-session";
import {Not} from "typeorm";

import {
  Match,
  MatchPlayer,
  MatchPlayerPublic,
  MatchPublic,
  MatchPlayerService,
} from "@modules/match";
import {
  RELATIONSHIP_STATUS,
  UserInterim,
  UserPublicRT,
  RelationshipService,
  UserService,
} from "@modules/user";
import {RedisService, RP} from "@lib/redis";

@Controller("/profile")
export class ProfileController {
  constructor(
    private readonly redisService: RedisService,
    private readonly relationshipService: RelationshipService,
    private readonly userService: UserService,
    private readonly matchPlayerService: MatchPlayerService,
  ) {}

  @Get("/me")
  async getMe(@Session() session: Sess): Promise<{user: UserPublicRT}> {
    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${session.user.id}`,
    );

    const isOnline = !!interim && interim.isOnline;

    const user = {
      ...session.user.public,
      isOnline,
    };

    return {user};
  }

  @Get("/me/matches")
  async getMyMatches(@Session() session: Sess): Promise<{
    matches: (MatchPublic & {
      player: MatchPlayerPublic;
      opponents: MatchPlayerPublic[];
    })[];
  }> {
    const players = await this.matchPlayerService.find({
      where: {user: session.user},
    });

    const entities: {
      match: Match;
      player: MatchPlayer;
      opponents: MatchPlayer[];
    }[] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      const opponents = await this.matchPlayerService.find({
        where: {match: player.match, user: {id: Not(session.user.id)}},
      });

      entities[i] = {match: player.match, player, opponents};
    }

    return {
      matches: entities.map(({match, player, opponents}) => ({
        ...match.public,
        player: player.public,
        opponents: opponents.map((opponent) => opponent.public),
      })),
    };
  }

  @Get("/me/friends")
  async getMyFriends(
    @Session() session: Sess,
  ): Promise<{friends: UserPublicRT[]}> {
    const relationships = await this.relationshipService.find({
      where: [
        {user1: session.user, status: RELATIONSHIP_STATUS.FRIENDS},
        {user2: session.user, status: RELATIONSHIP_STATUS.FRIENDS},
      ],
    });

    const users = relationships.map(({user1, user2}) =>
      user1.id === session.user.id ? user2 : user1,
    );

    const friends: UserPublicRT[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const interim = await this.redisService.get<UserInterim>(
        `${RP.USER}:${user.id}`,
      );

      const isOnline = !!interim && interim.isOnline;

      friends[i] = {...user.public, isOnline};
    }

    return {friends};
  }

  @Get("/:id")
  async getUser(@Param("id") id: string): Promise<{user: UserPublicRT}> {
    const user = await this.userService.findOne({where: {id}});

    if (!user) throw new BadRequestException("No user found");

    const interim = await this.redisService.get<UserInterim>(
      `${RP.USER}:${user.id}`,
    );

    const isOnline = !!interim && interim.isOnline;

    const plain = {
      ...user.public,
      isOnline,
    };

    return {
      user: plain,
    };
  }

  @Get("/:id/matches")
  async getUserMatches(@Param("id") id: string): Promise<{
    matches: (MatchPublic & {
      player: MatchPlayerPublic;
      opponents: MatchPlayerPublic[];
    })[];
  }> {
    const user = await this.userService.findOne({where: {id}});

    if (!user) throw new BadRequestException("No user found");

    const players = await this.matchPlayerService.find({where: {user}});

    const entities: {
      match: Match;
      player: MatchPlayer;
      opponents: MatchPlayer[];
    }[] = [];

    for (let i = 0; i < players.length; i++) {
      const player = players[i];

      const opponents = await this.matchPlayerService.find({
        where: {match: player.match, user: {id: Not(user.id)}},
      });

      entities[i] = {match: player.match, player, opponents};
    }

    return {
      matches: entities.map(({match, player, opponents}) => ({
        ...match.public,
        player: player.public,
        opponents: opponents.map((opponent) => opponent.public),
      })),
    };
  }

  @Get("/:id/friends")
  async getUserFriends(
    @Param("id") id: string,
  ): Promise<{friends: UserPublicRT[]}> {
    const user = await this.userService.findOne({where: {id}});

    if (!user) throw new BadRequestException("No user found");

    const relationships = await this.relationshipService.find({
      where: [
        {user1: user, status: RELATIONSHIP_STATUS.FRIENDS},
        {user2: user, status: RELATIONSHIP_STATUS.FRIENDS},
      ],
    });

    const users = relationships.map(({user1, user2}) =>
      user1.id === user.id ? user2 : user1,
    );

    const friends: UserPublicRT[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const interim = await this.redisService.get<UserInterim>(
        `${RP.USER}:${user.id}`,
      );

      const isOnline = !!interim && interim.isOnline;

      friends[i] = {...user.public, isOnline};
    }

    return {friends};
  }
}
