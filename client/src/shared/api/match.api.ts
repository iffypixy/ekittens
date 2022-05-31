import {socket} from "@shared/lib/websocket";
import {CardType} from "@entities/card";

export const matchEvents = {
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
}

export interface StartMatchData {
  lobbyId: string;
}

export interface StartMatchOutput {
  match: Match;
}

const start = (data: StartMatchData): Promise<StartMatchOutput> =>
  new Promise((resolve) => {
    socket.emit(matchEvents.server.START, data, resolve);
  });

export interface DrawCardData {
  matchId: string;
}

export interface DrawCardOutput {
  card: CardType;
}

const drawCard = (data: DrawCardData): Promise<DrawCardOutput> =>
  new Promise((resolve) => {
    socket.emit(matchEvents.server.DRAW_CARD, data, resolve);
  });

export interface PlayCardData {
  matchId: string;
  card: CardType;
  playerId?: string;
}

const playCard = (data: PlayCardData): Promise<void> =>
  new Promise((resolve) => {
    socket.emit(matchEvents.server.PLAY_CARD, data, resolve);
  });

export interface PlayDefuseData {
  matchId: string;
}

const playDefuse = (data: PlayDefuseData): Promise<void> =>
  new Promise((resolve) => {
    socket.emit(matchEvents.server.PLAY_DEFUSE, data, resolve);
  });

export interface SetCardSpotData {
  matchId: string;
  spot: number;
}

const setCardSpot = (data: SetCardSpotData): Promise<void> =>
  new Promise((resolve) => {
    socket.emit(matchEvents.server.SET_CARD_SPOT, data, resolve);
  });

export const matchApi = {
  start,
  drawCard,
  playCard,
  playDefuse,
  setCardSpot,
};
