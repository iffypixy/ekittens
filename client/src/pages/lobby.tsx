import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";
import {Navigate, useNavigate} from "react-router-dom";

import {CenterTemplate, FullScreenTemplate} from "@shared/ui/templates";
import {Avatar, Button, Icon, Text} from "@shared/ui/atoms";
import {Col, Row} from "@shared/lib/layout";
import {useDispatch} from "@shared/lib/store";
import {socket} from "@shared/lib/websocket";
import {lobbyEvents, LobbyPlayer, matchEvents} from "@shared/api";
import {avatars} from "@shared/lib/avatars";
import {lobbyModel} from "@features/lobby";
import {matchModel} from "@features/match";

export const LobbyPage: React.FC = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const lobby = useSelector(lobbyModel.selectors.lobby)!;

  React.useEffect(() => {
    socket.on(
      lobbyEvents.client.PLAYER_JOINED,
      ({player}: {player: LobbyPlayer}) => {
        dispatch(lobbyModel.actions.addPlayer({player}));
      },
    );

    socket.on(matchEvents.client.MATCH_STARTED, ({match, cards}) => {
      dispatch(matchModel.actions.setMatch({match}));
      dispatch(matchModel.actions.setCards({cards}));

      navigate("/match");
    });

    return () => {
      socket.off(lobbyEvents.client.PLAYER_JOINED);
    };
  }, []);

  if (!lobby) return <Navigate to="/" />;

  const player = lobby.players.find((player) => player.id === socket.id);

  const handleInviteButtonClick = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/invite/${lobby.id}`,
    );
  };

  const handleStartButtonClick = () => {
    const isEnough = lobby.players.length >= 2;

    if (isEnough) dispatch(matchModel.actions.startMatch({lobbyId: lobby.id}));
  };

  return (
    <FullScreenTemplate>
      <CenterTemplate>
        <Wrapper gap={3} align="center">
          <Col w="100%" align="center" gap={4}>
            <Text size={2} uppercase>
              Lobby
            </Text>

            <Col w="100%" gap={2}>
              {lobby.players.map(({id, username, avatar, role}) => (
                <Player
                  key={id}
                  name={username}
                  avatar={avatars[avatar]}
                  isOwner={role === "owner"}
                />
              ))}

              {Array.from({length: 5 - lobby.players.length}).map((_, idx) => (
                <PlayerSkeleton key={idx} />
              ))}
            </Col>
          </Col>

          <Row
            w="100%"
            justify={
              player!.role === "owner" && lobby.players.length >= 2
                ? "space-between"
                : "center"
            }
          >
            <Button onClick={handleInviteButtonClick}>Invite</Button>
            {player!.role === "owner" && lobby.players.length >= 2 && (
              <Button onClick={handleStartButtonClick}>Start</Button>
            )}
          </Row>
        </Wrapper>
      </CenterTemplate>
    </FullScreenTemplate>
  );
};

const Wrapper = styled(Col)`
  width: 55rem;
  background-color: #ffffff;
  box-shadow: 0 0 0 1rem rgba(0, 0, 0, 0.05);
  border-radius: 2rem;
  padding: 5rem;

  @media (max-width: 480px) {
    width: 80%;
  }
`;

interface PlayerProps {
  name: string;
  avatar: string;
  isOwner: boolean;
}

const Player: React.FC<PlayerProps> = ({name, avatar, isOwner}) => (
  <PlayerWrapper align="center" justify="space-between">
    <Row align="center" w="80%" gap={4}>
      <Avatar size={7} src={avatar} alt={`${name}'s avatar`} />
      <PlayerText ellipsis secondary>
        {name}
      </PlayerText>
    </Row>

    {isOwner && <PlayerIcon name="crown" />}
  </PlayerWrapper>
);

const PlayerSkeleton: React.FC = () => (
  <PlayerWrapper align="center" gap={4}>
    <Avatar size={7} />
    <PlayerText secondary>Empty</PlayerText>
  </PlayerWrapper>
);

const PlayerText = styled(Text)`
  font-size: 1.6rem;
  width: 60%;

  @media (max-width: 480px) {
    margin-left: 2rem !important;
  }
`;

const PlayerWrapper = styled(Row)`
  width: 100%;
  background-color: #000000;
  border-radius: 10rem 1rem 1rem 10rem;
  padding: 1rem 1.5rem;
`;

const PlayerIcon = styled(Icon)`
  width: 3rem;
  fill: #ffffff;
`;
