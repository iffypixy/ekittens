import {CardType} from "@entities/card/lib";
import {socket} from "@shared/lib/websocket";

const events = {
  server: {
    CREATE_MATCH: "create-match",
    JOIN_MATCH: "join-match",
  },
};

interface Match {
  id: string;
  deck: CardType[];
}

interface CreateMatchOptions {
  username: string;
  avatar: number;
}

interface CreateMatchResponse {
  match: Match;
}

const createMatch = (
  options: CreateMatchOptions,
): Promise<CreateMatchResponse> =>
  new Promise((resolve) => {
    socket.emit(events.server.CREATE_MATCH, options, resolve);
  });

interface JoinMatchOptions {
  id: string;
  username: string;
  avatar: number;
}

interface JoinMatchResponse {
  match: Match;
}

const joinMatch = (options: JoinMatchOptions): Promise<JoinMatchResponse> =>
  new Promise((resolve) => {
    socket.emit(events.server.JOIN_MATCH, options, resolve);
  });

export const matchApi = {joinMatch, createMatch};
