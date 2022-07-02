import {
  Lobby,
  LobbyParticipant,
  LobbyPublic,
  OngoingMatch,
  OngoingMatchPublic,
} from "./typings";

const match = (match: OngoingMatch): OngoingMatchPublic => {
  const {
    id,
    players,
    out,
    discard,
    turn,
    votes,
    state,
    context,
    type,
    spectators,
  } = match;

  return {
    id,
    discard,
    votes,
    context,
    turn,
    state,
    type,
    spectators: spectators.map((user) => user.public),
    out: out.map(({user, cards, marked}) => ({
      ...user.public,
      cards: cards.length,
      marked,
    })),
    players: players.map(({user, cards, marked}) => ({
      ...user.public,
      cards: cards.length,
      marked,
    })),
  };
};

const lobby = (lobby: Lobby): LobbyPublic => {
  const {id, participants, disabled} = lobby;

  return {
    id,
    disabled,
    participants: participants.map(lobbyParticipant),
  };
};

const lobbyParticipant = (participant: LobbyParticipant) => ({
  ...participant.user.public,
  role: participant.role,
  as: participant.as,
});

export const plain = {match, lobby, lobbyParticipant};
