import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import {InjectQueue} from "@nestjs/bull";
import Bull, {Queue} from "bull";
import {Server, Socket} from "socket.io";
import {nanoid} from "nanoid";

import {User, UserService} from "@modules/user";
import {RedisService, RP} from "@lib/redis";
import {utils} from "@lib/utils";
import {ack, WsResponse, WsService} from "@lib/ws";
import {elo} from "@lib/elo";
import {events} from "../lib/events";
import {DEFEAT_REASON, MATCH_STATE, QUEUE} from "../lib/constants";
import {
  CardActionQueuePayload,
  InactivityQueuePayload,
  Card,
} from "../lib/typings";
import {
  AlterFutureCardsDto,
  DefuseDto,
  DrawCardDto,
  InsertExplodingKittenDto,
  LeaveMatchDto,
  PlayCardDto,
  SpeedUpExplosionDto,
  BuryCardDto,
  ShareFutureCardsDto,
  InsertImplodingKittenDto,
  JoinMatchDto,
  LeaveSpectatorsDto,
  JoinSpectatorsDto,
} from "../dtos/gateways";
import {Match, MatchPlayer, OngoingMatch} from "../entities";
import {OngoingMatchService} from "../services";
import {chatEvents} from "@modules/chat";

@WebSocketGateway()
export class MatchGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;
  private service: WsService;

  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
    private readonly ongoingMatchService: OngoingMatchService,
    @InjectQueue(QUEUE.CARD_ACTION.NAME)
    private readonly cardActionQueue: Queue<CardActionQueuePayload>,
    @InjectQueue(QUEUE.INACTIVITY.NAME)
    private readonly inactivityQueue: Queue<InactivityQueuePayload>,
  ) {}

  private async startInactivityTimer(
    payload: InactivityQueuePayload,
    options?: Bull.JobOptions,
  ) {
    await this.inactivityQueue.add(
      payload,
      options || {
        jobId: payload.matchId,
        delay: QUEUE.INACTIVITY.DELAY.COMMON,
      },
    );
  }

  // private async startCardActionTimer(
  //   payload: CardActionQueuePayload,
  //   options?: Bull.JobOptions,
  // ) {
  //   // await this.cardActionQueue.add(
  //   //   payload,
  //   //   options || {
  //   //     jobId: payload.matchId,
  //   //     delay: QUEUE.CARD_ACTION.DELAY,
  //   //   },
  //   // );
  // }

  private async stopInactivityTimer(id: Bull.Job["id"]) {
    const job = await this.inactivityQueue.getJob(id);

    if (job) await job.remove();
  }

  private async handleDefeat(match: OngoingMatch, id: string): Promise<void> {
    const user = User.create(
      match.out.find((player) => player.user.id === id).user,
    );

    let shift: number;

    const isPublic = match.type === "public";

    if (isPublic) {
      const opponents = [...match.players, ...match.out].filter(
        (p) => p.user.id !== user.id,
      );

      const rating = elo.ifLost(
        user.rating,
        opponents.map((player) => player.user.rating),
      );

      shift = rating - user.rating;

      user.rating = rating;

      await user.save();
    }

    await MatchPlayer.update(
      {user: {id: user.id}, match: {id: match.id}},
      {
        shift,
        isWinner: false,
      },
    );

    await this.userService.setInterim(user.id, {
      activity: null,
    });

    const sockets = this.service.getSocketsByUserId(id);

    sockets.forEach((socket) => {
      socket.leave(match.id);
    });
  }

  private async handleVictory(match: OngoingMatch, id: string): Promise<void> {
    const user = User.create(
      match.players.find((player) => player.user.id === id).user,
    );

    let shift: number;

    const isPublic = match.type === "public";

    if (isPublic) {
      const opponents = [...match.players, ...match.out].filter(
        (p) => p.user.id !== user.id,
      );

      const rating = elo.ifWon(
        user.rating,
        opponents.map((player) => player.user.rating),
      );

      shift = rating - user.rating;

      user.rating = rating;

      await user.save();
    }

    await MatchPlayer.update(
      {user: {id: user.id}, match: {id: match.id}},
      {
        shift,
        isWinner: true,
      },
    );

    await this.userService.setInterim(user.id, {
      activity: null,
    });

    const sockets = this.service.getSocketsByUserId(id);

    sockets.forEach((socket) => {
      socket.leave(match.id);
    });
  }

  private async handleEnd(match: OngoingMatch): Promise<void> {
    await Match.update({id: match.id}, {status: "completed"});

    await this.redisService.delete(`${RP.MATCH}:${match.id}`);
  }

  async handleCardAction({
    match,
    card,
    payload,
  }: {
    match: OngoingMatch;
    card: Card;
    payload: any;
  }) {
    match.resetSkipVotes();

    const isNoped = match.context.noped;

    if (isNoped) {
      this.server.to(match.id).emit(events.client.ACTION_NOPED);

      match.resetNope();

      this.server.to(match.id).emit(events.client.NOPED_CHANGE, {
        noped: match.context.noped,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });

      await this.startInactivityTimer({matchId: match.id});

      await this.ongoingMatchService.save(match);

      return;
    }

    const player = match.players[match.turn];

    const isAttack = card === "attack";
    const isTargetedAttack = card === "targeted-attack";
    const isPersonalAttack = card === "personal-attack";
    const isSeeTheFuture3X = card === "see-the-future-3x";
    const isSeeTheFuture5X = card === "see-the-future-5x";
    const isSeeTheFuture = isSeeTheFuture3X || isSeeTheFuture5X;
    const isAlterTheFuture3X = card === "alter-the-future-3x";
    const isShareTheFuture3X = card === "share-the-future-3x";
    const isShuffle = card === "shuffle";
    const isSkip = card === "skip";
    const isSuperSkip = card === "super-skip";
    const isDrawFromTheBottom = card === "draw-from-the-bottom";
    const isSwapTopAndBottom = card === "swap-top-and-bottom";
    const isReverse = card === "reverse";
    const isCatomicBomb = card === "catomic-bomb";
    const isMark = card === "mark";
    const isBury = card === "bury";

    let isExposedToExplodingKitten = false;

    if (isAttack) {
      match.addAttacks(2);

      this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
        attacks: match.context.attacks,
      });

      match.changeTurn();

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        turn: match.turn,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isSeeTheFuture) {
      const end = isSeeTheFuture3X ? 3 : isSeeTheFuture5X ? 5 : 0;

      const cards = match.draw.slice(0, end).filter(Boolean);

      const sockets = this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id);

      this.server.to(sockets).emit(events.client.FUTURE_CARDS_RECEIVE, {
        cards,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isShuffle) {
      match.draw = utils.shuffle(match.draw);

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });

      match.updateIKSpot();

      this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
        spot: match.context.ikspot,
      });
    } else if (isSkip) {
      if (match.isAttacked) match.lessenAttacks();

      this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
        attacks: match.context.attacks,
      });

      if (!match.isAttacked) {
        match.changeTurn();

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          turn: match.turn,
        });
      }

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isTargetedAttack) {
      match.addAttacks(2);

      this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
        attacks: match.context.attacks,
      });

      match.turn = match.players.findIndex(
        (player) => player.user.id === payload.playerId,
      );

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        turn: match.turn,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isDrawFromTheBottom) {
      const card = match.draw.pop();

      const sockets = this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id);

      if (match.isAttacked) {
        match.lessenAttacks();

        this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
          attacks: match.context.attacks,
        });
      }

      const isClosedImplodingKitten = card === "imploding-kitten-closed";
      const isOpenImplodingKitten = card === "imploding-kitten-open";
      const isImplodingKitten =
        isClosedImplodingKitten || isOpenImplodingKitten;

      const isExplodingKitten = card === "exploding-kitten";

      const hasEnoughStreakingKittens =
        player.cards.filter((card) => card.name === "streaking-kitten")
          .length >=
        player.cards.filter((card) => card.name === "exploding-kitten").length +
          1;

      isExposedToExplodingKitten =
        isExplodingKitten && !hasEnoughStreakingKittens;

      if (isImplodingKitten) {
        if (isClosedImplodingKitten) {
          this.server
            .to(sockets)
            .emit(events.client.SELF_CLOSED_IMPLODING_KITTEN_DRAW);

          this.server
            .to(match.id)
            .except(sockets)
            .emit(events.client.CLOSED_IMPLODING_KITTEN_DRAW, {
              playerId: player.user.id,
            });

          match.setState({
            type: MATCH_STATE.IIK,
          });

          this.server.to(match.id).emit(events.client.STATE_CHANGE, {
            state: match.state,
          });
        } else if (isOpenImplodingKitten) {
          this.server
            .to(sockets)
            .emit(events.client.SELF_OPEN_IMPLODING_KITTEN_DRAW);

          this.server
            .to(match.id)
            .except(sockets)
            .emit(events.client.OPEN_IMPLODING_KITTEN_DRAW, {
              playerId: player.user.id,
            });

          match.removePlayer(player.user.id);

          const reason = DEFEAT_REASON.EBIK;

          match.addLoser({...player, reason});

          this.server.to(sockets).emit(events.client.SELF_PLAYER_DEFEAT, {
            reason,
            shift:
              elo.ifLost(
                player.user.rating,
                [...match.out, ...match.players]
                  .filter(
                    (participant) => participant.user.id !== player.user.id,
                  )
                  .map((participant) => participant.user.rating),
              ) - player.user.rating,
            rating: elo.ifLost(
              player.user.rating,
              [...match.out, ...match.players]
                .filter((participant) => participant.user.id !== player.user.id)
                .map((participant) => participant.user.rating),
            ),
          });

          this.server
            .to(match.id)
            .except(sockets)
            .emit(events.client.PLAYER_DEFEAT, {
              playerId: player.user.id,
              reason,
            });

          await this.handleDefeat(match, player.user.id);

          if (match.isEnd) {
            const winner = match.players[0];

            const sockets = this.service
              .getSocketsByUserId(winner.user.id)
              .map((socket) => socket.id);

            this.server.to(sockets).emit(events.client.SELF_VICTORY, {
              rating: elo.ifWon(
                winner.user.rating,
                match.out.map((player) => player.user.rating),
              ),
              shift:
                elo.ifWon(
                  winner.user.rating,
                  match.out.map((player) => player.user.rating),
                ) - winner.user.rating,
            });

            this.server
              .to(match.id)
              .except(sockets)
              .emit(events.client.VICTORY, {
                winner: winner.user.public,
                rating: elo.ifWon(
                  winner.user.rating,
                  match.out.map((player) => player.user.rating),
                ),
                shift:
                  elo.ifWon(
                    winner.user.rating,
                    match.out.map((player) => player.user.rating),
                  ) - winner.user.rating,
              });

            await this.handleVictory(match, winner.user.id);
            await this.handleEnd(match);

            return ack({ok: true});
          }

          const isReversed = match.context.reversed;

          if (isReversed) {
            const previous = match.players[match.turn - 1];

            if (previous) match.turn--;
            else match.turn = match.players.length - 1;
          }

          match.updateTurn();

          this.server.to(match.id).emit(events.client.TURN_CHANGE, {
            turn: match.turn,
          });

          match.setState({
            type: MATCH_STATE.WFA,
          });

          this.server.to(match.id).emit(events.client.STATE_CHANGE, {
            state: match.state,
          });
        }
      } else if (isExposedToExplodingKitten) {
        this.server.to(sockets).emit(events.client.SELF_EXPLOSION);

        this.server.to(match.id).except(sockets).emit(events.client.EXPLOSION, {
          playerId: player.user.id,
        });

        match.setState({
          type: MATCH_STATE.DEK,
        });

        this.server.to(match.id).emit(events.client.STATE_CHANGE, {
          state: match.state,
        });
      } else {
        const details = {
          id: nanoid(),
          name: card,
        };

        this.server.to(sockets).emit(events.client.SELF_BOTTOM_CARD_DRAW, {
          card: details,
        });

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.BOTTOM_CARD_DRAW, {
            playerId: player.user.id,
            cardId: details.id,
          });

        player.cards.push(details);

        if (!match.isAttacked) {
          match.changeTurn();

          this.server.to(match.id).emit(events.client.TURN_CHANGE, {
            turn: match.turn,
          });
        }

        match.setState({
          type: MATCH_STATE.WFA,
        });

        this.server.to(match.id).emit(events.client.STATE_CHANGE, {
          state: match.state,
        });
      }
    } else if (isReverse) {
      match.toggleReversed();

      this.server.to(match.id).emit(events.client.REVERSED_CHANGE, {
        reversed: match.context.reversed,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isSuperSkip) {
      match.resetAttacks();

      this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
        attacks: match.context.attacks,
      });

      match.changeTurn();

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        turn: match.turn,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isSwapTopAndBottom) {
      match.swapTopAndBottom();
      match.updateIKSpot();

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });

      this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
        spot: match.context.ikspot,
      });
    } else if (isCatomicBomb) {
      const deck = match.draw.filter((card) => card !== "exploding-kitten");
      const shuffled = utils.shuffle(deck);

      const amount = match.draw.filter(
        (card) => card === "exploding-kitten",
      ).length;

      const addition = new Array<Card>(amount).fill("exploding-kitten");

      shuffled.unshift(...addition);

      match.draw = shuffled;

      match.changeTurn();

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        turn: match.turn,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });

      match.updateIKSpot();

      this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
        spot: match.context.ikspot,
      });
    } else if (isPersonalAttack) {
      match.addAttacks(3);

      this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
        attacks: match.context.attacks,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isAlterTheFuture3X) {
      const cards = match.draw.slice(0, 3).filter(Boolean);

      match.setState({
        type: MATCH_STATE.ATF,
        payload: {cards},
      });

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isMark) {
      const target = match.players.find(
        (player) => player.user.id === payload.playerId,
      );

      target.marked.push(payload.cardId);

      const card = target.cards.find((card) => card.id === payload.cardId);

      const sockets = this.service
        .getSocketsByUserId(target.user.id)
        .map((socket) => socket.id);

      this.server.to(sockets).emit(events.client.SELF_CARD_MARK, {
        card,
        playerId: player.user.id,
      });

      this.server.to(match.id).except(sockets).emit(events.client.CARD_MARK, {
        card,
        playerId: target.user.id,
      });

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });

      match.players = match.players.map((p) =>
        p.user.id === target.user.id ? target : p,
      );
    } else if (isBury) {
      const card = match.draw[0];

      const sockets = this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id);

      this.server.to(sockets).emit(events.client.SELF_BURYING_CARD_DISPLAY, {
        card,
      });

      match.setState({
        type: MATCH_STATE.BC,
        payload: {card},
      });

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else if (isShareTheFuture3X) {
      const cards = match.draw.slice(0, 3).filter(Boolean);

      match.setState({
        type: MATCH_STATE.STF,
        payload: {
          cards,
          next: match.players[match.nextTurn].user,
        },
      });

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });

      this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
        spot: match.context.ikspot,
      });
    }

    await this.startInactivityTimer(
      {
        matchId: match.id,
        reason: isExposedToExplodingKitten ? DEFEAT_REASON.EBEK : undefined,
      },
      {
        jobId: match.id,
        delay: isExposedToExplodingKitten
          ? QUEUE.INACTIVITY.DELAY.DEFUSE
          : QUEUE.INACTIVITY.DELAY.COMMON,
      },
    );

    match.players = match.players.map((p) =>
      p.user.id === player.user.id ? player : p,
    );

    await this.ongoingMatchService.save(match);

    return;
  }

  async afterInit(server: Server) {
    this.service = new WsService(server);

    this.inactivityQueue.process(async (job, done) => {
      const {matchId, reason: initialReason} = job.data;

      const match = await this.ongoingMatchService.get(matchId);

      if (!match) return done(null, {continue: false});

      const player = match.players[match.turn];

      const reason = initialReason || DEFEAT_REASON.WIFTL;

      match.removePlayer(player.user.id);
      match.addLoser({...player, reason});

      const sockets = this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id);

      this.server.to(sockets).emit(events.client.SELF_PLAYER_DEFEAT, {
        reason,
        shift:
          elo.ifLost(
            player.user.rating,
            [...match.out, ...match.players]
              .filter((participant) => participant.user.id !== player.user.id)
              .map((participant) => participant.user.rating),
          ) - player.user.rating,
        rating: elo.ifLost(
          player.user.rating,
          [...match.out, ...match.players]
            .filter((participant) => participant.user.id !== player.user.id)
            .map((participant) => participant.user.rating),
        ),
      });

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.PLAYER_DEFEAT, {
          playerId: player.user.id,
          reason,
        });

      await this.handleDefeat(match, player.user.id);

      match.resetState();

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });

      if (match.isEnd) {
        const winner = match.players[0];

        const sockets = this.service
          .getSocketsByUserId(winner.user.id)
          .map((socket) => socket.id);

        this.server.to(sockets).emit(events.client.SELF_VICTORY, {
          rating: elo.ifWon(
            winner.user.rating,
            match.out.map((player) => player.user.rating),
          ),
          shift:
            elo.ifWon(
              winner.user.rating,
              match.out.map((player) => player.user.rating),
            ) - winner.user.rating,
        });

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.VICTORY, {
            winner: winner.user.public,
            rating: elo.ifWon(
              winner.user.rating,
              match.out.map((player) => player.user.rating),
            ),
            shift:
              elo.ifWon(
                winner.user.rating,
                match.out.map((player) => player.user.rating),
              ) - winner.user.rating,
          });

        await this.handleVictory(match, winner.user.id);
        await this.handleEnd(match);

        return done(null, {continue: false});
      }

      if (match.isReversed) {
        const previous = match.players[match.turn - 1];

        if (previous) match.turn--;
        else match.turn = match.players.length - 1;
      }

      match.updateTurn();

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        turn: match.turn,
      });

      match.context.ikspot =
        typeof match.context.ikspot === "number"
          ? match.draw.length -
            (match.draw.findIndex((card) => card === "imploding-kitten-open") +
              1)
          : null;

      this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
        spot: match.context.ikspot,
      });

      await this.ongoingMatchService.save(match);

      return done(null, {continue: true});
    });

    this.inactivityQueue.on(
      "completed",
      async (job, payload: {continue: boolean}) => {
        if (payload.continue) await this.startInactivityTimer(job.data);
      },
    );
  }

  @SubscribeMessage(events.server.JOIN_MATCH)
  async joinMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinMatchDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const user = socket.request.session.user;

    const player = [...match.players, ...match.out].find(
      (player) => player.user.id === user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    socket.join(match.id);

    socket.on("disconnect", () => {
      const sockets = this.service
        .getSocketsByUserId(user.id)
        .filter((s) => s.id !== socket.id);

      const isDisconnected = sockets.length === 0;

      if (isDisconnected) {
        this.server.to(match.id).emit(events.client.PLAYER_DISCONNECT, {
          playerId: user.id,
        });
      }
    });

    return ack({
      ok: true,
      payload: {
        match: match.public(user.id),
      },
    });
  }

  @SubscribeMessage(events.server.JOIN_SPECTATORS)
  async joinSpectators(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: JoinSpectatorsDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const id = match.id;

    const user = socket.request.session.user;

    const isPlayer = match.players.some((player) => player.user.id === user.id);

    if (isPlayer) return ack({ok: false, msg: "You are a player of the match"});

    const sockets = this.service
      .getSocketsByUserId(user.id)
      .map((socket) => socket.id);

    socket.join(id);

    socket.on("disconnect", async () => {
      const sockets = this.service
        .getSocketsByUserId(user.id)
        .filter((s) => s.id !== socket.id);

      const isDisconnected = sockets.length === 0;

      if (isDisconnected) {
        const match = await this.ongoingMatchService.get(id);

        if (!match) return;

        match.spectators = match.spectators.filter(
          (spec) => spec.id !== user.id,
        );

        this.server.to(match.id).emit(events.client.SPECTATOR_LEAVE, {
          userId: user.id,
        });

        await this.ongoingMatchService.save(match);
      }
    });

    const hydrated = User.create(user);

    const isSpectator = match.spectators.some((spec) => spec.id === user.id);

    if (!isSpectator) {
      match.spectators.push(hydrated);

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.NEW_SPECTATOR, {
          user: hydrated.public,
        });
    }

    await this.ongoingMatchService.save(match);

    return ack({ok: true, payload: {match: match.public(user.id)}});
  }

  @SubscribeMessage(events.server.LEAVE_SPECTATORS)
  async leaveSpectators(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: LeaveSpectatorsDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const user = socket.request.session.user;

    const isSpectator = match.spectators.some((spec) => spec.id === user.id);

    if (!isSpectator) return ack({ok: false, msg: "You are not a spectator"});

    socket.leave(match.id);

    const left = this.service
      .getSocketsByUserId(user.id)
      .filter((s) => s.id !== socket.id);

    const isEmpty = left.length === 0;

    if (isEmpty) {
      match.spectators = match.spectators.filter((spec) => spec.id !== user.id);

      this.server.to(match.id).emit(events.client.SPECTATOR_LEAVE, {
        userId: user.id,
      });

      await this.ongoingMatchService.save(match);
    }

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.LEAVE_MATCH)
  async leaveMatch(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: LeaveMatchDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const playerIndex = match.players.findIndex(
      (p) => p.user.id === player.user.id,
    );

    const isTurn = playerIndex === match.turn;

    if (isTurn) await this.stopInactivityTimer(match.id);

    match.removePlayer(player.user.id);
    match.addLoser({...player, reason: "left-match"});

    const sockets = this.service.getSocketsByUserId(player.user.id);

    sockets.forEach((socket) => {
      socket.leave(match.id);
    });

    const ids = sockets.map((socket) => socket.id);

    this.server.to(ids).emit(events.client.SELF_PLAYER_DEFEAT);

    this.server.to(match.id).except(ids).emit(events.client.PLAYER_DEFEAT, {
      player: player.user.public,
      reason: "left-match",
    });

    this.server
      .to(match.id)
      .except(ids)
      .emit(chatEvents.client.NEW_MESSAGE, {
        message: {
          id: nanoid(),
          sender: {username: "SERVER"},
          text: `${player.user.username} left the match`,
          createdAt: Date.now(),
        },
      });

    this.handleDefeat(match, player.user.id);

    if (match.isEnd) {
      const winner = match.players[0];

      const sockets = this.service
        .getSocketsByUserId(winner.user.id)
        .map((socket) => socket.id);

      this.server.to(sockets).emit(events.client.SELF_VICTORY, {
        rating: elo.ifWon(
          winner.user.rating,
          match.out.map((player) => player.user.rating),
        ),
        shift:
          elo.ifWon(
            winner.user.rating,
            match.out.map((player) => player.user.rating),
          ) - winner.user.rating,
      });

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.VICTORY, {
          winner: winner.public,
          rating: elo.ifWon(
            winner.user.rating,
            match.out.map((player) => player.user.rating),
          ),
          shift:
            elo.ifWon(
              winner.user.rating,
              match.out.map((player) => player.user.rating),
            ) - winner.user.rating,
        });

      await this.handleVictory(match, winner.user.id);
      await this.handleEnd(match);

      return ack({ok: true});
    }

    const isTurnAffected = playerIndex >= match.turn;

    if (isTurnAffected) {
      if (isTurn) {
        const isReversed = match.context.reversed;

        if (isReversed) {
          const previous = match.players[match.turn - 1];

          if (previous) match.turn--;
          else match.turn = match.players.length - 1;
        }

        match.updateTurn();

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          turn: match.turn,
        });

        match.setState({
          type: MATCH_STATE.WFA,
        });

        this.server.to(match.id).emit(events.client.STATE_CHANGE, {
          state: match.state,
        });
      } else {
        match.turn--;
      }
    }

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.DRAW_CARD)
  async drawCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DrawCardDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.WFA);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to draw a card"});

    await this.stopInactivityTimer(match.id);

    const card = match.draw.shift();

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    if (match.isAttacked) {
      match.lessenAttacks();

      this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
        attacks: match.context.attacks,
      });
    }

    const isClosedImplodingKitten = card === "imploding-kitten-closed";
    const isOpenImplodingKitten = card === "imploding-kitten-open";
    const isImplodingKitten = isClosedImplodingKitten || isOpenImplodingKitten;

    const isExplodingKitten = card === "exploding-kitten";

    const hasEnoughStreakingKittens =
      player.cards.filter((card) => card.name === "streaking-kitten").length >=
      player.cards.filter((card) => card.name === "exploding-kitten").length +
        1;

    const isExposedToExplodingKitten =
      isExplodingKitten && !hasEnoughStreakingKittens;

    if (isImplodingKitten) {
      if (isClosedImplodingKitten) {
        this.server
          .to(sockets)
          .emit(events.client.SELF_CLOSED_IMPLODING_KITTEN_DRAW);

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.CLOSED_IMPLODING_KITTEN_DRAW, {
            playerId: player.user.id,
          });

        match.setState({
          type: MATCH_STATE.IIK,
        });

        this.server.to(match.id).emit(events.client.STATE_CHANGE, {
          state: match.state,
        });
      } else if (isOpenImplodingKitten) {
        this.server
          .to(sockets)
          .emit(events.client.SELF_OPEN_IMPLODING_KITTEN_DRAW);

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.OPEN_IMPLODING_KITTEN_DRAW, {
            playerId: player.user.id,
          });

        match.removePlayer(player.user.id);

        const reason = DEFEAT_REASON.EBIK;

        match.addLoser({...player, reason});

        this.server.to(sockets).emit(events.client.SELF_PLAYER_DEFEAT, {
          reason,
          shift:
            elo.ifLost(
              player.user.rating,
              [...match.out, ...match.players]
                .filter((participant) => participant.user.id !== player.user.id)
                .map((participant) => participant.user.rating),
            ) - player.user.rating,
          rating: elo.ifLost(
            player.user.rating,
            [...match.out, ...match.players]
              .filter((participant) => participant.user.id !== player.user.id)
              .map((participant) => participant.user.rating),
          ),
        });

        this.server
          .to(match.id)
          .except(sockets)
          .emit(events.client.PLAYER_DEFEAT, {
            playerId: player.user.id,
            reason,
          });

        await this.handleDefeat(match, player.user.id);

        if (match.isEnd) {
          const winner = match.players[0];

          const sockets = this.service
            .getSocketsByUserId(winner.user.id)
            .map((socket) => socket.id);

          this.server.to(sockets).emit(events.client.SELF_VICTORY, {
            rating: elo.ifWon(
              winner.user.rating,
              match.out.map((player) => player.user.rating),
            ),
            shift:
              elo.ifWon(
                winner.user.rating,
                match.out.map((player) => player.user.rating),
              ) - winner.user.rating,
          });

          this.server
            .to(match.id)
            .except(sockets)
            .emit(events.client.VICTORY, {
              winner: winner.user.public,
              rating: elo.ifWon(
                winner.user.rating,
                match.out.map((player) => player.user.rating),
              ),
              shift:
                elo.ifWon(
                  winner.user.rating,
                  match.out.map((player) => player.user.rating),
                ) - winner.user.rating,
            });

          await this.handleVictory(match, winner.user.id);
          await this.handleEnd(match);

          return ack({ok: true});
        }

        const isReversed = match.context.reversed;

        if (isReversed) {
          const previous = match.players[match.turn - 1];

          if (previous) match.turn--;
          else match.turn = match.players.length - 1;
        }

        match.updateTurn();

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          turn: match.turn,
        });

        match.setState({
          type: MATCH_STATE.WFA,
        });

        this.server.to(match.id).emit(events.client.STATE_CHANGE, {
          state: match.state,
        });
      }
    } else if (isExposedToExplodingKitten) {
      this.server.to(sockets).emit(events.client.SELF_EXPLOSION);

      this.server.to(match.id).except(sockets).emit(events.client.EXPLOSION, {
        playerId: player.user.id,
      });

      match.setState({
        type: MATCH_STATE.DEK,
      });

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    } else {
      const details = {
        id: nanoid(),
        name: card,
      };

      this.server.to(sockets).emit(events.client.SELF_CARD_DRAW, {
        card: details,
      });

      this.server.to(match.id).except(sockets).emit(events.client.CARD_DRAW, {
        playerId: player.user.id,
        cardId: details.id,
      });

      player.cards.push(details);

      if (!match.isAttacked) {
        match.changeTurn();

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          turn: match.turn,
        });
      }

      match.setState({
        type: MATCH_STATE.WFA,
      });

      this.server.to(match.id).emit(events.client.STATE_CHANGE, {
        state: match.state,
      });
    }

    match.updateIKSpot();

    this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
      spot: match.context.ikspot,
    });

    const delay = isExposedToExplodingKitten
      ? QUEUE.INACTIVITY.DELAY.DEFUSE
      : QUEUE.INACTIVITY.DELAY.COMMON;

    await this.startInactivityTimer(
      {
        matchId: match.id,
        reason: isExposedToExplodingKitten ? DEFEAT_REASON.EBEK : undefined,
      },
      {
        delay,
        jobId: match.id,
      },
    );

    match.players = match.players.map((p) =>
      p.user.id === player.user.id ? player : p,
    );

    await this.ongoingMatchService.save(match);

    return ack({
      ok: true,
      payload: {card},
    });
  }

  @SubscribeMessage(events.server.PLAY_CARD)
  async playCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: PlayCardDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.WFA);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to play a card"});

    const card = player.cards.find((card) => card.id === dto.cardId);

    if (!card) return ack({ok: false, msg: "No card found"});

    const isTargetedAttack = card.name === "targeted-attack";
    const isMark = card.name === "mark";

    if (isTargetedAttack) {
      const payload: {
        playerId: string;
      } = dto.payload;

      const targeted = match.players
        .filter((p) => p.user.id !== player.user.id)
        .find((player) => player.user.id === payload.playerId);

      if (!targeted) return ack({ok: false, msg: "No targeted player found"});
    } else if (isMark) {
      const payload: {
        playerId: string;
        cardId: string;
      } = dto.payload;

      const targeted = match.players
        .filter((p) => p.user.id !== player.user.id)
        .find((player) => player.user.id === payload.playerId);

      if (!targeted) return ack({ok: false, msg: "No targeted player found"});

      const card = targeted.cards.find((card) => card.id === payload.cardId);

      if (!card) return ack({ok: false, msg: "No targeted card found"});

      const isAlreadyMarked = targeted.marked.includes(payload.cardId);

      if (isAlreadyMarked)
        return ack({ok: false, msg: "Targeted card is already marked"});
    }

    await this.stopInactivityTimer(match.id);

    match.last = player.user.id;

    player.cards = player.cards.filter((c) => c.id !== card.id);
    player.marked = player.marked.filter((id) => id !== card.id);

    match.discard.push(card.name);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_CARD_PLAY, {card});

    this.server.to(match.id).except(sockets).emit(events.client.CARD_PLAY, {
      card,
      playerId: player.user.id,
    });

    // match.setState({
    //   type: MATCH_STATE.ACTION_DELAY,
    // });

    // this.server.to(match.id).emit(events.client.STATE_CHANGE, {
    //   state: match.state,
    // });

    await this.handleCardAction({match, card: card.name, payload: dto.payload});

    match.players = match.players.map((p) =>
      p.user.id === player.user.id ? player : p,
    );

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  // @SubscribeMessage(events.server.NOPE_CARD_ACTION)
  // async nopeCardAction(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() dto: NopeCardActionDto,
  // ): Promise<WsResponse> {
  //   const match = await this.ongoingMatchService.get(dto.matchId);

  //   if (!match) return ack({ok: false, msg: "No match found"});

  //   const player = match.players.find(
  //     (player) => player.user.id === socket.request.session.user.id,
  //   );

  //   if (!player)
  //     return ack({ok: false, msg: "You are not a player of the match"});

  //   const isAllowed = match.isState(MATCH_STATE.ACTION_DELAY);

  //   if (!isAllowed)
  //     return ack({ok: false, msg: "You are not allowed to nope a card"});

  //   const card = player.cards.find((card) => card.id === dto.cardId);

  //   if (!card) return ack({ok: false, msg: "No card found"});

  //   const isNope = card.name === "nope";

  //   if (!isNope) return ack({ok: false, msg: "It is not a nope card"});

  //   const job = await this.cardActionQueue.getJob(match.id);

  //   await job.remove();

  //   match.last = player.user.id;

  //   match.toggleNoped();

  //   this.server.to(match.id).emit(events.client.NOPED_CHANGE, {
  //     noped: match.context.noped,
  //     playerId: player.user.id,
  //     cardId: card.id,
  //   });

  //   // match.setState({type: MATCH_STATE.ACTION_DELAY});

  //   this.server.to(match.id).emit(events.client.STATE_CHANGE, {
  //     state: match.state,
  //   });

  //   player.cards = player.cards.filter((c) => c.id !== card.id);

  //   match.players = match.players.map((p) =>
  //     p.user.id === player.user.id ? player : p,
  //   );

  //   await this.startCardActionTimer(job.data);

  //   await this.handleCardAction({
  //     match,
  //     card: job.data.card,
  //     payload: job.data.payload,
  //   });

  //   await this.ongoingMatchService.save(match);

  //   return ack({ok: true});
  // }

  @SubscribeMessage(events.server.DEFUSE_EXPLODING_KITTEN)
  async defuseExplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: DefuseDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.DEK);

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to defuse an exploding kitten",
      });

    const card = player.cards.find((card) => card.id === dto.cardId);

    if (!card) return ack({ok: false, msg: "No card found"});

    const isDefuse = card.name === "defuse";

    if (!isDefuse) return ack({ok: false, msg: "It is not a defuse card"});

    await this.stopInactivityTimer(match.id);

    player.cards = player.cards.filter((c) => c.id !== card.id);

    match.discard.push("defuse");

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_EXPLOSION_DEFUSE);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLOSION_DEFUSE, {
        playerId: player.user.id,
        cardId: card.id,
      });

    const isOnlyCardLeft = match.draw.length === 0;

    if (isOnlyCardLeft) {
      match.draw.push("exploding-kitten");

      this.server.to(sockets).emit(events.client.SELF_EXPLODING_KITTEN_INSERT);

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.EXPLODING_KITTEN_INSERT);

      match.setState({type: MATCH_STATE.WFA});

      if (!match.isAttacked) {
        match.changeTurn();

        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
          turn: match.turn,
        });
      }
    } else {
      this.server
        .to(sockets)
        .emit(events.client.SELF_EXPLODING_KITTEN_INSERT_REQUEST);

      this.server
        .to(match.id)
        .except(sockets)
        .emit(events.client.EXPLODING_KITTEN_INSERT_REQUEST, {
          playerId: player.user.id,
        });

      match.setState({
        type: MATCH_STATE.IEK,
      });
    }

    this.server.to(match.id).emit(events.client.STATE_CHANGE, {
      state: match.state,
    });

    await this.startInactivityTimer({matchId: match.id});

    match.players = match.players.map((p) =>
      p.user.id === player.user.id ? player : p,
    );

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.INSERT_EXPLODING_KITTEN)
  async insertExplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InsertExplodingKittenDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.IEK);

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to insert an exploding kitten",
      });

    await this.stopInactivityTimer(match.id);

    match.draw.splice(dto.spotIndex, 0, "exploding-kitten");

    match.draw = match.draw.filter(Boolean);

    match.updateIKSpot();

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_EXPLODING_KITTEN_INSERT);

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.EXPLODING_KITTEN_INSERT);

    this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
      spot: match.context.ikspot,
    });

    if (!match.isAttacked) {
      match.changeTurn();

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        turn: match.turn,
      });
    }

    match.resetState();

    this.server.to(match.id).emit(events.client.STATE_CHANGE, {
      state: match.state,
    });

    await this.startInactivityTimer({matchId: match.id});

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  // @SubscribeMessage(events.server.SKIP_NOPE)
  // async skipNope(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() dto: SkipNopeDto,
  // ): Promise<WsResponse> {
  //   const match = await this.ongoingMatchService.get(dto.matchId);

  //   if (!match) return ack({ok: false, msg: "No match found"});

  //   const player = match.players.find(
  //     (player) => player.user.id === socket.request.session.user.id,
  //   );

  //   if (!player)
  //     return ack({ok: false, msg: "You are not a player of the match"});

  //   const isAllowed = match.isState(MATCH_STATE.ACTION_DELAY);

  //   if (!isAllowed) return ack({ok: false, msg: "It is not nope wait"});

  //   const current = match.players[match.turn];

  //   const isTurn = player.user.id === current.user.id;

  //   if (isTurn)
  //     return ack({ok: false, msg: "You can't skip nope on your turn"});

  //   const hasAlreadyVoted = match.votes.skip.includes(player.user.id);

  //   if (hasAlreadyVoted) return ack({ok: false, msg: "You have already voted"});

  //   await this.stopInactivityTimer(match.id);

  //   match.votes.skip.push(player.user.id);

  //   const sockets = this.service
  //     .getSocketsByUserId(player.user.id)
  //     .map((socket) => socket.id);

  //   this.server.to(sockets).emit(events.client.SELF_NOPE_SKIP_VOTE);

  //   this.server
  //     .to(match.id)
  //     .except(sockets)
  //     .emit(events.client.NOPE_SKIP_VOTE, {
  //       voted: match.votes.skip,
  //     });

  //   const toSkip =
  //     match.players
  //       .map((player) => player.user.id)
  //       .filter((id) => id !== current.user.id)
  //       .sort()
  //       .toString() === [...match.votes.skip].sort().toString();

  //   if (toSkip) {
  //     const job = await this.cardActionQueue.getJob(match.id);

  //     await job.remove();

  //     await this.startCardActionTimer(job.data, {});

  //     this.server.to(match.id).emit(events.client.ACTION_SKIPPED);
  //   }

  //   await this.ongoingMatchService.save(match);

  //   return ack({ok: true});
  // }

  @SubscribeMessage(events.server.ALTER_FUTURE_CARDS)
  async alterFutureCards(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: AlterFutureCardsDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.ATF);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to alter future cards"});

    const areTheSameCards =
      [...dto.order].sort().toString() ===
      match.draw.slice(0, 3).filter(Boolean).sort().toString();

    if (!areTheSameCards)
      return ack({ok: false, msg: "The cards are not the same"});

    await this.stopInactivityTimer(match.id);

    match.draw.splice(0, 3, ...dto.order);

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_FUTURE_CARDS_ALTER, {
      cards: dto.order,
    });

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.FUTURE_CARDS_ALTER);

    match.resetState();

    this.server.to(match.id).emit(events.client.STATE_CHANGE, {
      state: match.state,
    });

    match.updateIKSpot();

    this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
      spot: match.context.ikspot,
    });

    await this.startInactivityTimer({matchId: match.id});

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.SPEED_UP_EXPLOSION)
  async speedUpExplosion(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: SpeedUpExplosionDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.DEK);

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to speed up an explosion",
      });

    const hasDefuse = player.cards.map((card) => card.name).includes("defuse");

    if (hasDefuse) return ack({ok: false, msg: "You have a defuse card"});

    await this.stopInactivityTimer(match.id);

    await this.startInactivityTimer({matchId: match.id}, {});

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.BURY_CARD)
  async buryCard(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: BuryCardDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.BC);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to bury a card"});

    await this.stopInactivityTimer(match.id);

    const card = match.draw.shift();

    match.draw.splice(dto.spotIndex, 0, card);

    match.updateIKSpot();

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(sockets).emit(events.client.SELF_CARD_BURY, {
      spotIndex: dto.spotIndex,
    });

    this.server.to(match.id).except(sockets).emit(events.client.CARD_BURY);

    this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
      spot: match.context.ikspot,
    });

    match.changeTurn();

    this.server.to(match.id).emit(events.client.TURN_CHANGE, {
      turn: match.turn,
    });

    match.resetState();

    this.server.to(match.id).emit(events.client.STATE_CHANGE, {
      state: match.state,
    });

    match.updateIKSpot();

    this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
      spot: match.context.ikspot,
    });

    await this.startInactivityTimer({matchId: match.id});

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.SHARE_FUTURE_CARDS)
  async shareFutureCards(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: ShareFutureCardsDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.STF);

    if (!isAllowed)
      return ack({ok: false, msg: "You are not allowed to share future cards"});

    const areTheSameCards =
      [...dto.order].sort().toString() ===
      match.draw.slice(0, 3).filter(Boolean).sort().toString();

    if (!areTheSameCards)
      return ack({ok: false, msg: "The cards are not the same"});

    await this.stopInactivityTimer(match.id);

    match.draw.splice(0, 3, ...dto.order);

    const next = match.players[match.nextTurn];

    const sockets = {
      player: this.service
        .getSocketsByUserId(player.user.id)
        .map((socket) => socket.id),
      next: this.service
        .getSocketsByUserId(next.user.id)
        .map((socket) => socket.id),
    };

    this.server.to(sockets.player).emit(events.client.SELF_FUTURE_CARDS_SHARE, {
      cards: dto.order,
    });

    this.server
      .to(sockets.next)
      .emit(events.client.SELF_FUTURE_CARDS_PLAYER_SHARE, {
        playerId: player.user.id,
        cards: dto.order,
      });

    this.server
      .to(match.id)
      .except(sockets.player)
      .emit(events.client.FUTURE_CARDS_SHARE);

    match.resetState();

    this.server.to(match.id).emit(events.client.STATE_CHANGE, {
      state: match.state,
    });

    match.updateIKSpot();

    this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
      spot: match.context.ikspot,
    });

    await this.startInactivityTimer({matchId: match.id});

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }

  @SubscribeMessage(events.server.INSERT_IMPLODING_KITTEN)
  async insertImplodingKitten(
    @ConnectedSocket() socket: Socket,
    @MessageBody() dto: InsertImplodingKittenDto,
  ): Promise<WsResponse> {
    const match = await this.ongoingMatchService.get(dto.matchId);

    if (!match) return ack({ok: false, msg: "No match found"});

    const player = match.players.find(
      (player) => player.user.id === socket.request.session.user.id,
    );

    if (!player)
      return ack({ok: false, msg: "You are not a player of the match"});

    const isTurn = player.user.id === match.players[match.turn].user.id;

    if (!isTurn) return ack({ok: false, msg: "It is not your turn"});

    const isAllowed = match.isState(MATCH_STATE.IIK);

    if (!isAllowed)
      return ack({
        ok: false,
        msg: "You are not allowed to insert an imploding kitten",
      });

    await this.stopInactivityTimer(match.id);

    match.draw.splice(dto.spotIndex, 0, "imploding-kitten-open");

    match.draw = match.draw.filter(Boolean);

    match.context.ikspot = match.draw.indexOf("imploding-kitten-open");

    const sockets = this.service
      .getSocketsByUserId(player.user.id)
      .map((socket) => socket.id);

    this.server.to(match.id).emit(events.client.IK_SPOT_CHANGE, {
      spot: match.context.ikspot,
    });

    this.server
      .to(match.id)
      .except(sockets)
      .emit(events.client.IMPLODING_KITTEN_INSERT, {
        spot: dto.spotIndex,
      });

    if (!match.isAttacked) {
      match.changeTurn();

      this.server.to(match.id).emit(events.client.TURN_CHANGE, {
        turn: match.turn,
      });
    }

    match.resetState();

    this.server.to(match.id).emit(events.client.STATE_CHANGE, {
      state: match.state,
    });

    await this.startInactivityTimer({matchId: match.id});

    await this.ongoingMatchService.save(match);

    return ack({ok: true});
  }
}
