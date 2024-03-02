import React from "react";
import {styled} from "@mui/material";
import {useLocation, useNavigate} from "react-router-dom";

import {currentLobbyModel} from "@features/current-lobby";

import {Layout} from "@shared/lib/layout";
import {Avatar, Text} from "@shared/ui/atoms";
import {ws} from "@shared/lib/ws";

export const LobbyIndicator: React.FC = () => {
  const lobby = currentLobbyModel.useLobby();

  const navigate = useNavigate();
  const location = useLocation();

  const {handlers} = currentLobbyModel.useWsHandlers();

  React.useEffect(() => {
    Object.keys(handlers).forEach((event) => {
      ws.on(event, handlers[event]);
    });

    return () => {
      Object.keys(handlers).forEach((event) => {
        ws.disable(event, handlers[event]);
      });
    };
  }, []);

  const isInLobby = location.pathname === `/lobby/${lobby?.id}`;

  if (!lobby || isInLobby) {
    Object.keys(handlers).forEach((event) => {
      ws.disable(event, handlers[event]);
    });

    return null;
  }

  const handleIndicatorClick = () => {
    navigate(`/lobby/${lobby?.id}`);
  };

  return (
    <Wrapper onClick={handleIndicatorClick}>
      <Layout.Row gap={1.5}>
        <VS>
          <Text font="primary" transform="uppercase">
            x
          </Text>
        </VS>

        <Layout.Col justify="space-between">
          <Title>in lobby</Title>
          <Layout.Row gap={-0.5}>
            {lobby.participants.map((participant) => (
              <Avatar key={participant.id} src={participant.avatar} size={2} />
            ))}
          </Layout.Row>
        </Layout.Col>
      </Layout.Row>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Row)`
  width: 25rem;
  justify-content: space-between;
  align-items: center;
  background-color: ${({theme}) => theme.palette.primary.main};
  border-radius: 2rem;
  position: fixed;
  bottom: 2.5rem;
  left: 2.5rem;
  padding: 1.5rem;
  z-index: 1000;
  cursor: pointer;
`;

const VS = styled(Layout.Row)`
  width: 4rem;
  height: 4rem;
  background-color: ${({theme}) => theme.palette.background.default};
  justify-content: center;
  align-items: center;
  border-radius: 50%;
`;

const Title = styled(Text)`
  color: ${({theme}) => theme.palette.primary.contrastText};
  font-family: "Bungee", sans-serif;
  font-weight: 400;
  font-size: 1.4rem;
`;
