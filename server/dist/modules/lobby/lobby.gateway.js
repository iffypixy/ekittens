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
exports.LobbyGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const nanoid_1 = require("nanoid");
const redis_1 = require("../../lib/redis");
const gateways_1 = require("./dtos/gateways");
const events = {
    server: {
        CREATE: "lobby:create",
        JOIN: "lobby:join",
        KICK_PLAYER: "lobby:kick-player",
        LEAVE: "lobby:leave",
    },
    client: {
        PLAYER_JOINED: "lobby:player-joined",
    },
};
let LobbyGateway = class LobbyGateway {
    async createLobby(dto, socket) {
        const player = {
            id: socket.id,
            username: dto.username,
            avatar: dto.avatar,
            role: "owner",
        };
        const lobby = {
            id: (0, nanoid_1.nanoid)(6),
            players: [player],
        };
        socket.join(lobby.id);
        await redis_1.redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));
        return { lobby };
    }
    async joinLobby(dto, socket) {
        const json = await redis_1.redis.get(`lobby:${dto.lobbyId}`);
        const lobby = JSON.parse(json);
        if (!lobby)
            throw new websockets_1.WsException("Invalid lobby id");
        const isAlreadyParticipant = lobby.players.some((player) => player.id === socket.id);
        if (isAlreadyParticipant)
            throw new websockets_1.WsException("You are already a participant");
        const player = {
            id: socket.id,
            username: dto.username,
            avatar: dto.avatar,
            role: "member",
        };
        lobby.players.push(player);
        this.server.to(lobby.id).emit(events.client.PLAYER_JOINED, { player });
        socket.join(lobby.id);
        await redis_1.redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));
        return {
            lobby,
        };
    }
    async kickPlayer(dto, socket) {
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
            throw new websockets_1.WsException("You are not an owner");
        lobby.players = lobby.players.filter((player) => player.id !== dto.playerId);
        await redis_1.redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));
        return {
            lobby,
        };
    }
    async leave(dto, socket) {
        const json = await redis_1.redis.get(`lobby:${dto.lobbyId}`);
        const lobby = JSON.parse(json);
        if (!lobby)
            throw new websockets_1.WsException("Invalid lobby id");
        const player = lobby.players.find((player) => player.id === socket.id);
        const isParticipant = !!player;
        if (!isParticipant)
            throw new websockets_1.WsException("You are not a participant");
        lobby.players = lobby.players.filter((player) => player.id !== socket.id);
        const isOwner = player.role === "owner";
        if (isOwner)
            lobby.players[0].role = "owner";
        await redis_1.redis.set(`lobby:${lobby.id}`, JSON.stringify(lobby));
        return {
            lobby,
        };
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], LobbyGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.CREATE),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.CreateLobbyDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "createLobby", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.JOIN),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.JoinLobbyDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "joinLobby", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.KICK_PLAYER),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.KickPlayerDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "kickPlayer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)(events.server.LEAVE),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gateways_1.LeaveDto,
        socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], LobbyGateway.prototype, "leave", null);
LobbyGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cookie: true,
        cors: {
            origin: process.env.CLIENT_ORIGIN,
            credentials: true,
        },
    })
], LobbyGateway);
exports.LobbyGateway = LobbyGateway;
//# sourceMappingURL=lobby.gateway.js.map