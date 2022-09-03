import {AxiosPromise} from "axios";

import {CardName, CardUnit} from "@entities/card";
import {OngoingMatchPlayer, DefeatReason} from "@entities/match";
import {LobbyParticipant} from "@entities/lobby";
import {User} from "@entities/user";

import {request} from "@shared/lib/request";
import {ws} from "@shared/lib/ws";

import {Lobby, LobbyModeType, OngoingMatch} from "./common";

const prefix = "match";

export const matchEvents = {
  server: {
    LEAVE_MATCH: `${prefix}:leave-match`,
    PLAY_CARD: `${prefix}:play-card`,
    DRAW_CARD: `${prefix}:draw-card`,
    DEFUSE_EXPLODING_KITTEN: `${prefix}:defuse-exploding-kitten`,
    INSERT_EXPLODING_KITTEN: `${prefix}:insert-exploding-kitten`,
    SPEED_UP_EXPLOSION: `${prefix}:speed-up-explosion`,
    SKIP_NOPE: `${prefix}:skip-nope`,
    ALTER_FUTURE_CARDS: `${prefix}:alter-future-cards`,
    BURY_CARD: `${prefix}:bury-card`,
    SHARE_FUTURE_CARDS: `${prefix}:share-future-cards`,
    INSERT_IMPLODING_KITTEN: `${prefix}:insert-imploding-kitten`,
    NOPE_CARD_ACTION: `${prefix}:nope-card-action`,
    JOIN_MATCH: `${prefix}:join-match`,
    JOIN_SPECTATORS: `${prefix}:join-spectators`,
    LEAVE_SPECTATORS: `${prefix}:leave-spectators`,
    CREATE_LOBBY: `${prefix}:create-lobby`,
    LEAVE_LOBBY: `${prefix}:leave-lobby`,
    INVITE_FRIEND: `${prefix}:invite-friend`,
    JOIN_AS_SPECTATOR: `${prefix}:join-as-spectator`,
    JOIN_AS_PLAYER: `${prefix}:join-as-player`,
    START_MATCH: `${prefix}:start-match`,
    KICK_PARTICIPANT: `${prefix}:kick-participant`,
    JOIN_QUEUE: `${prefix}:join-queue`,
    LEAVE_QUEUE: `${prefix}:leave-queue`,
    UPDATE_DISABLED: `${prefix}:update-disabled`,
    SET_MODE: `${prefix}:set-mode`,
    GET_CURRENT_LOBBY: `${prefix}:get-current-lobby`,
  },
  client: {
    NEW_PLAYER: `${prefix}:new-player`,
    SELF_VICTORY: `${prefix}:self-victory`,
    STATE_CHANGE: `${prefix}:state-change`,
    TURN_CHANGE: `${prefix}:turn-change`,
    VICTORY: `${prefix}:victory`,
    ATTACKS_CHANGE: `${prefix}:attacks-change`,
    NOPED_CHANGE: `${prefix}:noped-change`,
    ACTION_NOPED: `${prefix}:action-noped`,
    ACTION_SKIPPED: `${prefix}:action-skipped`,
    PLAYER_KICK: `${prefix}:player-kick`,
    SELF_PLAYER_KICK: `${prefix}:self-kick`,
    PLAYER_LEAVE: `${prefix}:player-leave`,
    SELF_PLAYER_LEAVE: `${prefix}:self-player-leave`,
    CARD_DRAW: `${prefix}:card-draw`,
    SELF_CARD_DRAW: `${prefix}:self-card-draw`,
    EXPLOSION: `${prefix}:explosion`,
    SELF_EXPLOSION: `${prefix}:self-explosion`,
    PLAYER_DEFEAT: `${prefix}:player-defeat`,
    SELF_PLAYER_DEFEAT: `${prefix}:self-player-defeat`,
    FUTURE_CARDS_RECEIVE: `${prefix}:future-cards-receive`,
    CARD_PLAY: `${prefix}:card-play`,
    SELF_CARD_PLAY: `${prefix}:self-card-play`,
    EXPLOSION_DEFUSE: `${prefix}:explosion-defuse`,
    SELF_EXPLOSION_DEFUSE: `${prefix}:self-explosion-defuse`,
    EXPLODING_KITTEN_INSERT_REQUEST: `${prefix}:exploding-kitten-insert-request`,
    SELF_EXPLODING_KITTEN_INSERT_REQUEST: `${prefix}:self-exploding-kitten-insert-request`,
    EXPLODING_KITTEN_INSERT: `${prefix}:exploding-kitten-insert`,
    SELF_EXPLODING_KITTEN_INSERT: `${prefix}:self-exploding-kitten-insert`,
    NOPE_SKIP_VOTE: `${prefix}:nope-skip-vote`,
    SELF_NOPE_SKIP_VOTE: `${prefix}:self-nope-skip-vote`,
    BOTTOM_CARD_DRAW: `${prefix}:bottom-card-draw`,
    SELF_BOTTOM_CARD_DRAW: `${prefix}:self-bottom-card-draw`,
    FUTURE_CARDS_ALTER: `${prefix}:future-cards-alter`,
    SELF_FUTURE_CARDS_ALTER: `${prefix}:self-future-cards-alter`,
    CARD_MARK: `${prefix}:card-mark`,
    SELF_CARD_MARK: `${prefix}:self-card-mark`,
    SELF_BURYING_CARD_DISPLAY: `${prefix}:self-burying-card-display`,
    CARD_BURY: `${prefix}:card-bury`,
    SELF_CARD_BURY: `${prefix}:self-card-bury`,
    FUTURE_CARDS_SHARE: `${prefix}:future-cards-share`,
    SELF_FUTURE_CARDS_SHARE: `${prefix}:self-future-cards-share`,
    SELF_FUTURE_CARDS_PLAYER_SHARE: `${prefix}:self-future-cards-player-share`,
    CLOSED_IMPLODING_KITTEN_DRAW: `${prefix}:open-imploding-kitten-draw`,
    SELF_CLOSED_IMPLODING_KITTEN_DRAW: `${prefix}:self-open-imploding-kitten-draw`,
    IMPLODING_KITTEN_INSERT: `${prefix}:imploding-kitten-insert`,
    SELF_IMPLODING_KITTEN_INSERT: `${prefix}:self-imploding-kitten-insert`,
    OPEN_IMPLODING_KITTEN_DRAW: `${prefix}:open-imploding-kitten-draw`,
    SELF_OPEN_IMPLODING_KITTEN_DRAW: `${prefix}:self-open-imploding-kitten-draw`,
    PLAYER_DISCONNECT: `${prefix}:player-disconnect`,
    NEW_SPECTATOR: `${prefix}:new-spectator`,
    SPECTATOR_LEAVE: `${prefix}:spectator-leave`,
    SELF_LOBBY_CREATION: `${prefix}:self-lobby-creation`,
    PARTICIPANT_LEAVE: `${prefix}:participant-leave`,
    SELF_PARTICIPANT_LEAVE: `${prefix}:self-participant-leave`,
    SELF_LOBBY_INVITATION: `${prefix}:self-lobby-invitation`,
    PARTICIPANT_JOIN: `${prefix}:participant-join`,
    SELF_PARTICIPANT_JOIN: `${prefix}:self-participant-join`,
    PLAYER_SWITCH: `${prefix}:player-switch`,
    SELF_PLAYER_SWITCH: `${prefix}:self-player-switch`,
    SPECTATOR_SWITCH: `${prefix}:spectator-switch`,
    SELF_SPECTATOR_SWITCH: `${prefix}:self-spectator-switch`,
    MATCH_START: `${prefix}:match-start`,
    INITIAL_CARDS_RECEIVE: `${prefix}:initial-cards-receive`,
    PARTICIPANT_KICKED: `${prefix}:participant-kicked`,
    SELF_PARTICIPANT_KICKED: `${prefix}:self-participant-kicked`,
    LEADER_SWITCH: `${prefix}:leader-switch`,
    SELF_PLAYER_DISCONNECT: `${prefix}:self-player-disconnect`,
    SELF_QUEUE_JOIN: `${prefix}:self-queue-join`,
    SELF_QUEUE_LEAVE: `${prefix}:self-queue-leave`,
    DISABLED_UPDATE: `${prefix}:disabled-update`,
    SELF_EK_EXPLODED: `${prefix}:self-ek-exploded`,
    EK_EXPLODED: `${prefix}:ek-exploded`,
    IK_SPOT_CHANGE: `${prefix}:ik-spot-change`,
    REVERSED_CHANGE: `${prefix}:reversed-change`,
    MODE_CHANGE: `${prefix}:mode-change`,
  },
};

export interface SelfVictoryEventOptions {
  shift: number;
  rating: number;
}

export interface VictoryEventOptions {
  winner: User;
  shift: number;
  rating: number;
}

export interface SelfPlayerDefeatEventOptions {
  shift: number;
  reason: DefeatReason;
  rating: number;
}

export interface PlayerDefeatEventOptions {
  player: OngoingMatchPlayer;
  reason: DefeatReason;
}

export interface CardMarkEventOptions {
  card: CardUnit;
  playerId: string;
}

export interface SelfCardMarkEventOptions {
  card: CardUnit;
}

export interface IKSpotChangeEventOptions {
  spot: number;
}

export interface FutureCardsReceiveEventOptions {
  cards: CardName[];
}

export interface SelfFutureCardsPlayerShareEventOptions {
  cards: CardName[];
}

export interface ReversedChangeEventOptions {
  reversed: boolean;
}

export interface ParticipantJoinEventOptions {
  participant: LobbyParticipant;
}

export interface ParticipantLeaveEventOptions {
  participant: LobbyParticipant;
}

export interface LeaderSwitchEventOptions {
  participant: LobbyParticipant;
}

export interface DisabledCardsUpdateEventOptions {
  disabled: CardName[];
}

export interface MatchStartEventOptions {
  match: OngoingMatch;
}

const joinQueue = () => ws.emit(matchEvents.server.JOIN_QUEUE);

export interface JoinMatchData {
  matchId: string;
}

export interface JoinMatchResponse {
  match: OngoingMatch;
  player: {
    cards: CardName[];
    marked: number[];
  };
}

const joinMatch = (data: JoinMatchData) =>
  ws.emit<JoinMatchData, JoinMatchResponse>(
    matchEvents.server.JOIN_MATCH,
    data,
  );

export interface DrawCardData {
  matchId: string;
}

export interface DrawCardResponse {
  card: CardName;
}

const drawCard = (data: DrawCardData) =>
  ws.emit<DrawCardData, DrawCardResponse>(matchEvents.server.DRAW_CARD, data);

export interface DefuseExplodingKittenData {
  matchId: string;
  cardId: string;
}

const defuse = (data: DefuseExplodingKittenData) =>
  ws.emit(matchEvents.server.DEFUSE_EXPLODING_KITTEN, data);

export interface InsertExplodingKittenData {
  matchId: string;
  spotIndex: number;
}

const insertExplodingKitten = (data: InsertExplodingKittenData) =>
  ws.emit(matchEvents.server.INSERT_EXPLODING_KITTEN, data);

export interface PlayCardData {
  matchId: string;
  cardId: string;
  payload?: any;
}

const playCard = (data: PlayCardData) =>
  ws.emit(matchEvents.server.PLAY_CARD, data);

export interface AlterFutureCardsData {
  matchId: string;
  order: CardName[];
}

const alterFutureCards = (data: AlterFutureCardsData) =>
  ws.emit(matchEvents.server.ALTER_FUTURE_CARDS, data);

export interface ShareFutureCardsData {
  matchId: string;
  order: CardName[];
}

const shareFutureCards = (data: ShareFutureCardsData) =>
  ws.emit(matchEvents.server.SHARE_FUTURE_CARDS, data);

export interface BuryCardData {
  matchId: string;
  spotIndex: number;
}

const buryCard = (data: BuryCardData) =>
  ws.emit(matchEvents.server.BURY_CARD, data);

export interface InsertImplodingKittenData {
  matchId: string;
  spotIndex: number;
}

const insertImplodingKitten = (data: InsertImplodingKittenData) =>
  ws.emit(matchEvents.server.INSERT_IMPLODING_KITTEN, data);

export interface NopeCardData {
  matchId: string;
  cardId: string;
}

const nopeCard = (data: NopeCardData) =>
  ws.emit(matchEvents.server.NOPE_CARD_ACTION, data);

export interface SpectateMatchData {
  matchId: string;
}

export interface SpectateMatchResponse {
  match: OngoingMatch;
}

const spectateMatch = (data: SpectateMatchData) =>
  ws.emit<SpectateMatchData, SpectateMatchResponse>(
    matchEvents.server.JOIN_SPECTATORS,
    data,
  );

export interface LeaveMatchAsPlayerData {
  matchId: string;
}

const leaveMatchAsPlayer = (data: LeaveMatchAsPlayerData) =>
  ws.emit(matchEvents.server.LEAVE_MATCH, data);

export interface LeaveMatchAsSpectatorData {
  matchId: string;
}

const leaveMatchAsSpectator = (data: LeaveMatchAsSpectatorData) =>
  ws.emit(matchEvents.server.LEAVE_SPECTATORS, data);

export interface CreateLobbyResponse {
  lobby: Lobby;
}

const createLobby = () =>
  ws.emit<void, CreateLobbyResponse>(matchEvents.server.CREATE_LOBBY);

export interface JoinLobbyData {
  lobbyId: string;
}

export interface JoinLobbyResponse {
  lobby: Lobby;
}

const joinLobbyAsPlayer = (data: JoinLobbyData) =>
  ws.emit<JoinLobbyData, JoinLobbyResponse>(
    matchEvents.server.JOIN_AS_PLAYER,
    data,
  );

export interface StartMatchData {
  lobbyId: string;
}

export interface StartMatchResponse {
  match: OngoingMatch;
}

const startMatch = (data: StartMatchData) =>
  ws.emit<StartMatchData, StartMatchResponse>(
    matchEvents.server.START_MATCH,
    data,
  );

export interface LeaveLobbyData {
  lobbyId: string;
}

const leaveLobby = (data: LeaveLobbyData) =>
  ws.emit(matchEvents.server.LEAVE_LOBBY, data);

export interface UpdateDisabledData {
  cards: CardName[];
  lobbyId: string;
}

const updateDisabled = (data: UpdateDisabledData) =>
  ws.emit(matchEvents.server.UPDATE_DISABLED, data);

const leaveQueue = () => ws.emit(matchEvents.server.LEAVE_QUEUE);

export interface GetQueueStatusResponse {
  isEnqueued: boolean;
  enqueuedAt: number;
}

const getQueueStatus = (): AxiosPromise<GetQueueStatusResponse> =>
  request({url: "/matches/queue/status", method: "GET"});

export interface SetGameModeData {
  lobbyId: string;
  type: LobbyModeType;
}

const setGameMode = (data: SetGameModeData) =>
  ws.emit(matchEvents.server.SET_MODE, data);

export interface KickParticipantData {
  lobbyId: string;
  participantId: string;
}

const kickParticipant = (data: KickParticipantData) =>
  ws.emit(matchEvents.server.KICK_PARTICIPANT, data);

export interface GetCurrentLobbyResponse {
  lobby: Lobby;
}

const getCurrentLobby = () =>
  ws.emit<void, GetCurrentLobbyResponse>(matchEvents.server.GET_CURRENT_LOBBY);

export const matchApi = {
  leaveQueue,
  updateDisabled,
  createLobby,
  leaveMatchAsPlayer,
  leaveMatchAsSpectator,
  joinQueue,
  joinMatch,
  drawCard,
  defuse,
  insertExplodingKitten,
  playCard,
  alterFutureCards,
  shareFutureCards,
  buryCard,
  insertImplodingKitten,
  nopeCard,
  spectateMatch,
  joinLobbyAsPlayer,
  startMatch,
  leaveLobby,
  getQueueStatus,
  kickParticipant,
  setGameMode,
  getCurrentLobby,
};
