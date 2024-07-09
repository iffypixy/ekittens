import React from "react";
import {styled} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {useSnackbar} from "notistack";

import {useDispatch} from "@app/store";
import {viewerModel} from "@entities/viewer";
import {Lobby} from "@entities/lobby";
import {userModel} from "@entities/user";
import {
  GameModeSelection,
  ActiveCards,
  lobbySettingsModel,
} from "@features/current-lobby/lobby-settings";
import {currentLobbyModel} from "@features/current-lobby";
import {
  LobbyActions,
  lobbyInteractionsModel,
} from "@features/current-lobby/lobby-interactions";
import {joinLobbyModel} from "@features/join-lobby";

import {Fullscreen} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Badge, Button, H3, H4, Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import {ws} from "@shared/lib/ws";
import {LobbyParticipant} from "@shared/api/common";

interface LobbyPageParams {
  id: string;
}

export const LobbyPage: React.FC = () => {
  const dispatch = useDispatch();

  const {id} = useParams<Partial<LobbyPageParams>>() as LobbyPageParams;

  const navigate = useNavigate();

  const {enqueueSnackbar} = useSnackbar();

  const credentials = viewerModel.useCredentials();

  const lobby = currentLobbyModel.useLobby();

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

  React.useEffect(() => {
    const fetch = (lobby: Lobby) => {
      dispatch(currentLobbyModel.actions.setLobby({lobby}));

      const ids = lobby.participants.map((p) => p.id);

      dispatch(userModel.actions.fetchInterim({ids}));
    };

    dispatch(joinLobbyModel.actions.joinAsPlayer({lobbyId: id}))
      .unwrap()
      .then((res) => {
        fetch(res.lobby);
      })
      .catch(() => {
        dispatch(joinLobbyModel.actions.joinAsSpectator({lobbyId: id}))
          .unwrap()
          .then((res) => {
            fetch(res.lobby);
          })
          .catch((error) => {
            enqueueSnackbar(error.message, {variant: "error"});

            navigate("/");
          });
      });
  }, []);

  if (!lobby) return null;

  const handleStartButtonClick = () => {
    const areParticipantsEnough = lobby.participants.length > 1;

    const toStart = areParticipantsEnough;

    if (!toStart) return;

    dispatch(lobbyInteractionsModel.actions.startMatch({lobbyId: lobby.id}));
  };

  const handleCopyButtonClick = () => {
    navigator.clipboard
      .writeText(`${window.location.origin}/lobby/${lobby.id}`)
      .then(() => {
        enqueueSnackbar("You have successfully copied URL to the clipboard", {
          variant: "success",
        });
      });
  };

  const me = lobby?.participants.find((p) => p.id === credentials.id);

  const isLeader = me?.role === "leader";

  return (
    <Fullscreen>
      <Sidebar>
        <Layout.Col h="100%" justify="space-between">
          <Layout.Col gap={5}>
            <Layout.Row align="center" gap={2}>
              <LobbyActions />

              <H3>private lobby</H3>
            </Layout.Row>

            <ParticipantsList
              participants={lobby.participants}
              withPermissions={isLeader}
            />

            <Layout.Row justify="space-between">
              {isLeader && (
                <Button
                  variant="contained"
                  endIcon={<StartIcon />}
                  onClick={handleStartButtonClick}
                  disabled={lobby.participants.length === 1}
                >
                  start
                </Button>
              )}

              <Button
                variant="outlined"
                color="info"
                startIcon={<LinkIcon />}
                onClick={handleCopyButtonClick}
              >
                invite
              </Button>
            </Layout.Row>
          </Layout.Col>
        </Layout.Col>
      </Sidebar>

      <Main>
        <Section gap={1}>
          {isLeader ? (
            <>
              <H4>You are the host</H4>
              <Text emphasis="secondary">
                This means only you can change the rules and start the game.
              </Text>
            </>
          ) : (
            <>
              <H4>waiting for host</H4>
              <Text emphasis="secondary">
                The host (first player) starts the game. Only they can change
                the rules.
              </Text>
            </>
          )}
        </Section>

        <Section gap={4}>
          <Layout.Col gap={1}>
            <H4>Game mode</H4>

            {isLeader ? (
              <Text emphasis="secondary">
                Select the preferable game mode with favourite cards
              </Text>
            ) : (
              <Text emphasis="secondary">
                Only the host can change the game mode
              </Text>
            )}
          </Layout.Col>

          <GameModeSelection />
        </Section>

        <Section gap={4}>
          <Layout.Col gap={1}>
            <H4>Active cards</H4>

            <Text emphasis="secondary">
              Cards that are going to be used in the game
            </Text>
          </Layout.Col>

          <ActiveCards />
        </Section>
      </Main>
    </Fullscreen>
  );
};

const Main = styled("main")`
  height: 100%;
  flex: 1;
  overflow-y: auto;

  & > :not(:last-child) {
    border-bottom: 2px dotted ${({theme}) => theme.palette.divider};
  }
`;

const Section = styled(Layout.Col)`
  padding: 3rem;
`;

const Sidebar = styled("aside")`
  width: 50rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({theme}) => theme.palette.background.paper};
  border-right: 1px solid ${({theme}) => theme.palette.divider};
  padding: 3rem;
`;

interface ParticipantsListProps {
  participants: LobbyParticipant[];
  withPermissions: boolean;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  withPermissions,
}) => {
  const dispatch = useDispatch();

  const credentials = viewerModel.useCredentials();

  const lobby = currentLobbyModel.useLobby()!;

  const {enqueueSnackbar} = useSnackbar();

  const handleRemoveButtonClick = (id: string) => {
    dispatch(
      lobbySettingsModel.actions.kickParticipant({
        lobbyId: lobby.id,
        participantId: id,
      }),
    )
      .unwrap()
      .then(() => {
        dispatch(
          currentLobbyModel.actions.removeParticipant({participantId: id}),
        );

        enqueueSnackbar(`You succesfully kicked the participant`, {
          variant: "success",
        });
      });
  };

  return (
    <Layout.Col gap={1}>
      {participants.map((participant, idx) => (
        <Player key={idx} align="center" justify="space-between">
          <Layout.Row>
            <Avatar size={7} src={participant.avatar} variant="circular" />
            <Layout.Col p={1} justify="space-between">
              <Layout.Row align="center" gap={1}>
                <Username>{participant.username}</Username>

                <Layout.Row align="center" gap={0.5}>
                  <Badge>{participant.role}</Badge>
                  <Badge>{participant.as}</Badge>
                </Layout.Row>
              </Layout.Row>

              <Layout.Row align="center" gap={1}>
                <TrophyIcon />

                <Text size={1.6} weight={700}>
                  {participant.rating}
                </Text>
              </Layout.Row>
            </Layout.Col>
          </Layout.Row>

          {credentials.id !== participant.id && withPermissions && (
            <CrossIcon
              onClick={() => handleRemoveButtonClick(participant.id)}
            />
          )}
        </Player>
      ))}
    </Layout.Col>
  );
};

const Player = styled(Layout.Row)`
  width: 100%;
  background-color: ${({theme}) => theme.palette.background.default};
  border: 1px solid ${({theme}) => theme.palette.divider};
  border-radius: 10px;
  border-bottom-left-radius: 30px;
  border-top-left-radius: 30px;
  overflow: hidden;
  padding-right: 2rem;
`;

const Username = styled(Text)`
  font-size: 1.6rem;
  font-weight: 700;
  text-transform: uppercase;
  max-width: 20rem;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StartIcon = styled(Icon.Start)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.primary.contrastText};
`;

const LinkIcon = styled(Icon.Link)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.primary};
`;

const TrophyIcon = styled(Icon.Trophy)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.primary};
`;

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
  cursor: pointer;
`;
