import {ws} from "@shared/lib/websocket";
import {CardType} from "@entities/card";

const prefix = "match";

const events = {
  server: {
    START_MATCH: `${prefix}:start-match`,
    DRAW_CARD: `${prefix}:draw-card`,
    PLAY_CARD: `${prefix}:play-card`,
    PLAY_DEFUSE_CARD: `${prefix}:play-defuse-card`,
    INSERT_EXPLODING_KITTEN: `${prefix}:insert-exploding-kitten`,
    SEND_MESSAGE: `${prefix}:send-message`,
  },
  client: {
    PLAYER_KICK: `${prefix}:player-kick`,
    SELF_PLAYER_KICK: `${prefix}:self-kick`,
    TURN_CHANGE: `${prefix}:turn-change`,
    VICTORY: `${prefix}:victory`,
    CARD_DRAW: `${prefix}:card-draw`,
    EXPLODING_KITTEN_DRAW: `${prefix}:exploding-kitten-draw`,
    SELF_EXPLODING_KITTEN_DRAW: `${prefix}:self-exploding-kitten-draw`,
    PLAYER_DEFEAT: `${prefix}:player-defeat`,
    SELF_PLAYER_DEFEAT: `${prefix}:self-player-defeat`,
    PLAYER_FAVORED: `${prefix}:player-favored`,
    SELF_PLAYER_FAVORED: `${prefix}:self-player-favored`,
    CARD_RECEIVE: `${prefix}:card-receive`,
    CARD_FAVORED: `${prefix}:card-favored`,
    FOLLOWING_CARDS_RECEIVE: `${prefix}:following-cards-receive`,
    CARD_PLAY: `${prefix}:card-play`,
    SELF_CARD_PLAY: `${prefix}:self-card-play`,
    ATTACKS_CHANGE: `${prefix}:attacks-change`,
    NOPE_CHANGE: `${prefix}:nope-change`,
    EXPLOSION_DEFUSE: `${prefix}:explosion-defuse`,
    SELF_EXPLOSION_DEFUSE: `${prefix}:self-explosion-defuse`,
    EXPLODING_KITTEN_INSERT_REQUEST: `${prefix}:exploding-kitten-insert-request`,
    SELF_EXPLODING_KITTEN_INSERT_REQUEST: `${prefix}:self-exploding-kitten-insert-request`,
    EXPLODING_KITTEN_INSERT: `${prefix}:exploding-kitten-insert`,
    SELF_EXPLODING_KITTEN_INSERT: `${prefix}:self-exploding-kitten-insert`,
    MATCH_START: `${prefix}:match-start`,
    MESSAGE_RECEIVE: `${prefix}:message-receive`,
  },
};

export interface MatchPlayer {
  id: string;
  username: string;
  avatar: number;
  kicked?: boolean;
  defeated?: boolean;
}

export interface Match {
  id: string;
  left: number;
  pile: CardType[];
  players: MatchPlayer[];
  turn: number;
  stopped?: boolean;
  hasToDefuse?: boolean;
  hasToChooseSpot?: boolean;
}

export interface StartMatchData {
  lobbyId: string;
}

export interface StartMatchOutput {
  match: Match;
}

const start = (data: StartMatchData) =>
  ws.emit<StartMatchOutput>(matchEvents.server.START_MATCH, data);

export interface DrawCardData {
  matchId: string;
}

export interface DrawCardOutput {
  card: CardType;
}

const drawCard = (data: DrawCardData) =>
  ws.emit<DrawCardOutput>(matchEvents.server.DRAW_CARD, data);

export interface PlayCardData {
  matchId: string;
  card: CardType;
  playerId?: string;
}

const playCard = (data: PlayCardData) =>
  ws.emit<void>(matchEvents.server.PLAY_CARD, data);

export interface PlayDefuseData {
  matchId: string;
}

const playDefuse = (data: PlayDefuseData) =>
  ws.emit<void>(matchEvents.server.PLAY_DEFUSE_CARD, data);

export interface SetCardSpotData {
  matchId: string;
  spot: number;
}

const setCardSpot = (data: SetCardSpotData) =>
  ws.emit<void>(matchEvents.server.INSERT_EXPLODING_KITTEN, data);

export interface SendMessageData {
  message: string;
  matchId: string;
}

const sendMessage = (data: SendMessageData) =>
  ws.emit<void>(matchEvents.server.SEND_MESSAGE, data);

export const matchEvents = events;

export const matchApi = {
  start,
  drawCard,
  playCard,
  playDefuse,
  setCardSpot,
  sendMessage,
};
