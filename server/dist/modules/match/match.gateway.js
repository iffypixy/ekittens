"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const bull_1 = require("@nestjs/bull");
const redis_1 = require("../../lib/redis");
const shuffle_1 = require("../../lib/shuffle");
const gateways_1 = require("./dtos/gateways");
const deck_1 = require("./lib/deck");
const plain_1 = require("./lib/plain");
const events = {
    server: {
        START: "match:start",
        DRAW_CARD: "match:draw-card",
        PLAY_CARD: "match:play-card",
        PLAY_DEFUSE: "match:play-defuse",
        SET_CARD_SPOT: "match:set-card-spot",
    },
    client: {
        KICKED: "match:kicked",
        PLAYER_KICKED: "match:player-kicked",
        TURN_CHANGE: "match:turn-change",
        VICTORY: "match:victory",
        CARD_DREW: "match:card-drew",
        EXPLODING_KITTEN_DREW: "match:exploding-kitten-drew",
        PLAYER_DEFEATED: "match:player-defeated",
        DEFEAT: "match:defeat",
        FAVORED: "match:favored",
        CARD_RECEIVED: "match:card-received",
        FAVOR_CARD: "match:favor-card",
        FOLLOWING_CARDS: "match:following-cards",
        CARD_PLAYED: "match:card-played",
        ATTACKS_CHANGE: "match:attacks-change",
        PLAYER_FAVORED: "match:player-favored",
        NOPE_CHANGE: "match:nope-change",
        EXPLOSION_DEFUSED: "match:explosion-defused",
        DEFUSED: "match:defused",
        EXPLODING_KITTEN_SPOT_REQUEST: "match:exploding-kitten-spot-request",
        EXPLODING_KITTEN_SET: "match:exploding-kitten-set",
        SET_EXPLODING_KITTEN: "match:set-exploding-kitten",
        MATCH_STARTED: "match:match-started",
        PLAYED_CARD: "match:played-card",
    },
};
const INACTIVE_DELAY = 15000;
const EXPLOSION_DELAY = 10000;
const FAVOR_RESPONSE_DELAY = 10000;
const SPOT_RESPONSE_DELAY = 10000;
const PLAY_DELAY = 5000;
let MatchGateway = class MatchGateway {
    constructor(inactiveQueue, explosionQueue, favorResponseQueue, playQueue, spotResponseQueue) {
        this.inactiveQueue = inactiveQueue;
        this.explosionQueue = explosionQueue;
        this.favorResponseQueue = favorResponseQueue;
        this.playQueue = playQueue;
        this.spotResponseQueue = spotResponseQueue;
    }
    async afterInit() {
        this.spotResponseQueue.process(async (job, done) => {
            const json = await redis_1.redis.get(`match:${job.data.matchId}`);
            const match = JSON.parse(json);
            if (!match)
                return done();
            const player = match.players[match.turn];
            const idx = Math.round(Math.random() * match.deck.length);
            match.deck.splice(idx, 0, "exploding-kitten");
            this.server.to(player.id).emit(events.client.SET_EXPLODING_KITTEN, {
                idx,
            });
            this.server
                .to(match.id)
                .except(player.id)
                .emit(events.client.EXPLODING_KITTEN_SET);
            const next = match.players[match.turn + 1];
            if (!!next)
                match.turn++;
            else
                match.turn = 0;
            this.server.to(match.id).emit(events.client.TURN_CHANGE, {
                turn: match.turn,
            });
            await this.inactiveQueue.add({ matchId: match.id }, {
                delay: INACTIVE_DELAY,
                jobId: match.id,
            });
            await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
            done();
        });
        this.playQueue.process(async (job, done) => {
            const { matchId, card, playerId } = job.data;
            const json = await redis_1.redis.get(`match:${matchId}`);
            const match = JSON.parse(json);
            if (!match)
                return done();
            if (match.context.nope) {
                await this.inactiveQueue.add({ matchId: match.id }, {
                    delay: INACTIVE_DELAY,
                    jobId: match.id,
                });
                match.locked = false;
                await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
                return done(null, true);
            }
            const turn = () => {
                const next = match.players[match.turn + 1];
                if (!!next)
                    match.turn++;
                else
                    match.turn = 0;
            };
            const player = match.players[match.turn];
            if (card === "attack") {
                turn();
                match.context.attacks += 2;
                this.server.to(match.id).emit(events.client.ATTACKS_CHANGE, {
                    attacks: match.context.attacks,
                });
                this.server.to(match.id).emit(events.client.TURN_CHANGE, {
                    turn: match.turn,
                });
                await this.inactiveQueue.add({ matchId: match.id }, {
                    delay: INACTIVE_DELAY,
                    jobId: match.id,
                });
            }
            else if (card === "see-the-future") {
                const start = match.deck.length - 3;
                const end = match.deck.length;
                const cards = match.deck.slice(start, end).filter(Boolean);
                this.server.to(player.id).emit(events.client.FOLLOWING_CARDS, {
                    cards,
                });
                await this.inactiveQueue.add({
                    matchId: match.id,
                }, {
                    delay: INACTIVE_DELAY,
                    jobId: match.id,
                });
            }
            else if (card === "shuffle") {
                match.deck = (0, shuffle_1.shuffle)(match.deck);
                await this.inactiveQueue.add({
                    matchId: match.id,
                }, {
                    delay: INACTIVE_DELAY,
                    jobId: match.id,
                });
            }
            else if (card === "skip") {
                turn();
                this.server.to(match.id).emit(events.client.TURN_CHANGE, {
                    turn: match.turn,
                });
                await this.inactiveQueue.add({ matchId: match.id }, {
                    delay: INACTIVE_DELAY,
                    jobId: match.id,
                });
            }
            match.locked = false;
            await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
            done();
        });
        this.favorResponseQueue.process(async (job, done) => {
            const json = await redis_1.redis.get(`match:${job.data.matchId}`);
            const match = JSON.parse(json);
            if (!match)
                return done();
            const requestor = match.players.find((player) => player.id === job.data.requestorId);
            if (!requestor)
                return done();
            const performer = match.players.find((player) => player.id === job.data.performerId);
            if (!performer)
                return done();
            const idx = Math.floor(Math.random() * performer.cards.length);
            const card = performer.cards[idx];
            performer.cards.splice(idx, 1);
            requestor.cards.push(card);
            match.players.map((player) => player.id === performer.id
                ? performer
                : player.id === requestor.id
                    ? requestor
                    : player);
            this.server.to(requestor.id).emit(events.client.CARD_RECEIVED, {
                card,
            });
            this.server.to(performer.id).emit(events.client.FAVOR_CARD, {
                card,
            });
            await this.inactiveQueue.add({ matchId: match.id }, {
                delay: INACTIVE_DELAY,
                jobId: match.id,
            });
            await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
            done();
        });
        this.explosionQueue.process(async (job, done) => {
            const json = await redis_1.redis.get(`match:${job.data.matchId}`);
            const match = JSON.parse(json);
            if (!match)
                return done();
            const player = match.players[match.turn];
            if (!player)
                return done();
            this.server.to(player.id).emit(events.client.DEFEAT);
            this.server
                .to(match.id)
                .except(player.id)
                .emit(events.client.PLAYER_DEFEATED, {
                playerId: player.id,
            });
            match.players.splice(match.turn, 1);
            const isEnd = match.players.length === 1;
            if (isEnd) {
                const winner = match.players[0];
                this.server.to(match.id).emit(events.client.VICTORY, {
                    playerId: winner.id,
                });
                await redis_1.redis.del(`match:${match.id}`);
                return done();
            }
            const next = match.players[match.turn];
            if (!next)
                match.turn = 0;
            this.server.to(match.id).emit(events.client.TURN_CHANGE, {
                turn: match.turn,
            });
            await this.inactiveQueue.add({ matchId: match.id }, { delay: INACTIVE_DELAY, jobId: match.id });
            await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
            done();
        });
        this.inactiveQueue.process(async (job, done) => {
            const json = await redis_1.redis.get(`match:${job.data.matchId}`);
            const match = JSON.parse(json);
            if (!match)
                return done(null, true);
            const player = match.players[match.turn];
            this.server.to(player.id).emit(events.client.KICKED);
            this.server
                .to(match.id)
                .except(player.id)
                .emit(events.client.PLAYER_KICKED, { playerId: player.id });
            match.players.splice(match.turn, 1);
            const isEnd = match.players.length === 1;
            if (isEnd) {
                this.server.to(match.id).emit(events.client.VICTORY, {
                    playerId: match.players[0].id,
                });
                await redis_1.redis.del(`match:${match.id}`);
                return done(null, true);
            }
            const next = match.players[match.turn];
            if (!next)
                match.turn = 0;
            this.server.to(match.id).emit(events.client.TURN_CHANGE, {
                turn: match.turn,
            });
            await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
            done();
        });
        this.inactiveQueue.on("completed", async (job, stop) => {
            console.log(job.data);
            if (!stop)
                await this.inactiveQueue.add(job.data, {
                    delay: job.opts.delay,
                    jobId: job.opts.jobId,
                });
        });
    }
    async start(dto, socket) {
        const json = await redis_1.redis.get(`lobby:${dto.lobbyId}`);
        const lobby = JSON.parse(json);
        if (!lobby)
            throw new websockets_1.WsException("Invalid lobby id");
        const player = lobby.players.find((player) => player.id === socket.id);
        const isParticipant = !!player;
        if (!isParticipant)
            throw new websockets_1.WsException("You are not a participant");
        const isOwner = player.role === "owner";
        if (!isOwner)
            throw new websockets_1.WsException("You do not have permission to start the match");
        await redis_1.redis.del(`lobby:${lobby.id}`);
        const { individual, main } = deck_1.deck.generate(lobby.players.length);
        console.log(main);
        const players = lobby.players.map((player, idx) => (Object.assign(Object.assign({}, player), { cards: individual[idx] })));
        const match = {
            id: lobby.id,
            deck: main,
            pile: [],
            turn: 0,
            locked: false,
            players,
            context: {
                attacks: 0,
                nope: false,
            },
        };
        await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
        match.players.forEach(({ id, cards }) => {
            this.server.to(id).emit(events.client.MATCH_STARTED, {
                match: plain_1.plain.match(match),
                cards,
            });
        });
        await this.inactiveQueue.add({
            matchId: match.id,
        }, {
            delay: INACTIVE_DELAY,
            jobId: match.id,
        });
        return {
            match: plain_1.plain.match(match),
        };
    }
    async drawCard(dto, socket) {
        const json = await redis_1.redis.get(`match:${dto.matchId}`);
        const match = JSON.parse(json);
        if (!match)
            throw new websockets_1.WsException("Invalid match id");
        const player = match.players.find((player) => player.id === socket.id);
        const isParticipant = !!player;
        if (!isParticipant)
            throw new websockets_1.WsException("You are not a participant");
        const isTurn = match.players[match.turn].id === player.id;
        if (!isTurn)
            throw new websockets_1.WsException("It is not your turn");
        const job = await this.inactiveQueue.getJob(match.id);
        await job.remove();
        const card = match.deck[match.deck.length - 1];
        match.deck.pop();
        this.server.to(match.id).except(player.id).emit(events.client.CARD_DREW, {
            playerId: player.id,
        });
        if (card === "exploding-kitten") {
            this.server
                .to(match.id)
                .except(player.id)
                .emit(events.client.EXPLODING_KITTEN_DREW, {
                playerId: player.id,
            });
            await this.explosionQueue.add({
                matchId: match.id,
            }, {
                jobId: match.id,
                delay: EXPLOSION_DELAY,
            });
        }
        else {
            player.cards.push(card);
            if (!!match.context.attacks)
                match.context.attacks--;
            if (!match.context.attacks) {
                const next = match.players[match.turn + 1];
                if (!!next)
                    match.turn++;
                else
                    match.turn = 0;
                this.server.to(match.id).emit(events.client.TURN_CHANGE, {
                    turn: match.turn,
                });
            }
            else {
                this.server
                    .to(match.id)
                    .emit(events.client.ATTACKS_CHANGE, { attacks: match.context.attacks });
            }
            await this.inactiveQueue.add({
                matchId: match.id,
            }, {
                delay: INACTIVE_DELAY,
                jobId: match.id,
            });
        }
        await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
        return {
            card,
        };
    }
    async playCard(dto, socket) {
        console.log("play card");
        const json = await redis_1.redis.get(`match:${dto.matchId}`);
        console.log(0);
        const match = JSON.parse(json);
        console.log(-1);
        if (!match)
            throw new websockets_1.WsException("Invalid match id");
        console.log(-2);
        const player = match.players.find((player) => player.id === socket.id);
        console.log(-3);
        const isParticipant = !!player;
        if (!isParticipant)
            throw new websockets_1.WsException("You are not a participant");
        const isTurn = match.players[match.turn].id === player.id;
        console.log(1);
        const job = await this.playQueue.getJob(match.id);
        console.log(2);
        const isNope = dto.card === "nope";
        console.log(3);
        const isAllowed = isNope && !!job;
        console.log(4);
        if (!isTurn && !isAllowed)
            throw new websockets_1.WsException("It is not your turn");
        console.log(5);
        if (match.locked && !isAllowed)
            throw new websockets_1.WsException("It is locked for now");
        console.log(6);
        if (isTurn) {
            console.log(7);
            const job = await this.inactiveQueue.getJob(match.id);
            console.log(8);
            if (job)
                await job.remove();
            console.log(9);
        }
        console.log(10);
        this.server.to(match.id).except(player.id).emit(events.client.CARD_PLAYED, {
            card: dto.card,
            playerId: player.id,
        });
        console.log(11);
        this.server
            .to(player.id)
            .emit(events.client.PLAYED_CARD, { playerId: socket.id });
        if (isNope) {
            if (job)
                await job.remove();
            match.context.nope = !match.context.nope;
            this.server.to(match.id).emit(events.client.NOPE_CHANGE, {
                nope: match.context.nope,
            });
            await this.playQueue.add(job.data, {
                delay: job.opts.delay,
                jobId: job.opts.jobId,
            });
        }
        else {
            match.locked = true;
            await this.playQueue.add({
                matchId: match.id,
                playerId: dto.playerId,
                card: dto.card,
            }, {
                delay: PLAY_DELAY,
                jobId: match.id,
            });
        }
        await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
        return {};
    }
    async playDefuse(dto, socket) {
        const json = await redis_1.redis.get(`match:${dto.matchId}`);
        const match = JSON.parse(json);
        if (!match)
            throw new websockets_1.WsException("Invalid match id");
        const player = match.players.find((player) => player.id === socket.id);
        const isParticipant = !!player;
        if (!isParticipant)
            throw new websockets_1.WsException("You are not a participant");
        const isTurn = match.players[match.turn].id === player.id;
        if (!isTurn)
            throw new websockets_1.WsException("It is not your turn");
        const job = await this.explosionQueue.getJob(match.id);
        if (!job)
            throw new websockets_1.WsException("There is no explosion");
        const hasDefuse = player.cards.includes("defuse");
        if (!hasDefuse)
            throw new websockets_1.WsException("You have no defuse card");
        await job.remove();
        const idx = player.cards.findIndex((card) => card === "defuse");
        player.cards.splice(idx, 1);
        this.server.to(player.id).emit(events.client.DEFUSED);
        this.server
            .to(match.id)
            .except(player.id)
            .emit(events.client.EXPLOSION_DEFUSED, {
            playerId: player.id,
        });
        this.server.to(player.id).emit(events.client.EXPLODING_KITTEN_SPOT_REQUEST);
        await this.spotResponseQueue.add({ matchId: match.id }, {
            delay: SPOT_RESPONSE_DELAY,
            jobId: match.id,
        });
        return {};
    }
    async setCardSpot(dto, socket) {
        const json = await redis_1.redis.get(`match:${dto.matchId}`);
        const match = JSON.parse(json);
        if (!match)
            throw new websockets_1.WsException("Invalid match id");
        const player = match.players.find((player) => player.id === socket.id);
        const isParticipant = !!player;
        if (!isParticipant)
            throw new websockets_1.WsException("You are not a participant");
        const isTurn = match.players[match.turn].id === player.id;
        if (!isTurn)
            throw new websockets_1.WsException("It is not your turn");
        const job = await this.spotResponseQueue.getJob(match.id);
        if (!job)
            throw new websockets_1.WsException("You are not requested to set a card spot");
        await job.remove();
        match.deck.splice(parseInt(dto.spot, 10), 0, "exploding-kitten");
        match.deck = match.deck.filter(Boolean);
        this.server.to(player.id).emit(events.client.SET_EXPLODING_KITTEN, {
            idx: parseInt(dto.spot, 10),
        });
        this.server
            .to(match.id)
            .except(player.id)
            .emit(events.client.EXPLODING_KITTEN_SET);
        const next = match.players[match.turn + 1];
        if (!!next)
            match.turn++;
        else
            match.turn = 0;
        this.server.to(match.id).emit(events.client.TURN_CHANGE, {
            turn: match.turn,
        });
        await this.inactiveQueue.add({ matchId: match.id }, {
            delay: INACTIVE_DELAY,
            jobId: match.id,
        });
        await redis_1.redis.set(`match:${match.id}`, JSON.stringify(match));
        return {};
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MatchGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.START),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.StartDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "start", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.DRAW_CARD),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.DrawCardDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "drawCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.PLAY_CARD),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.PlayCardDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "playCard", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.PLAY_DEFUSE),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.PlayDefuseDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "playDefuse", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.SET_CARD_SPOT),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.SetCardSpotDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MatchGateway.prototype, "setCardSpot", null);
MatchGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cookie: true,
        cors: {
            origin: process.env.CLIENT_ORIGIN,
            credentials: true,
        },
    }),
    __param(0, (0, bull_1.InjectQueue)("inactive")),
    __param(1, (0, bull_1.InjectQueue)("explosion")),
    __param(2, (0, bull_1.InjectQueue)("favor-response")),
    __param(3, (0, bull_1.InjectQueue)("play")),
    __param(4, (0, bull_1.InjectQueue)("spot-response")),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], MatchGateway);
exports.MatchGateway = MatchGateway;
//# sourceMappingURL=match.gateway.js.map