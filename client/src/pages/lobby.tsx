import * as React from "react";
import {styled, css, Popover} from "@mui/material";

import {ChatPanel} from "@features/chat";
import {Fullscreen} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Badge, Button, H3, H4, Text} from "@shared/ui/atoms";
import {Card, cards, CardName} from "@entities/card";
import {Icon} from "@shared/ui/icons";
import {useDispatch} from "@app/store";
import {useSelector} from "react-redux";
import {matchModel} from "@entities/match";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import {interimModel} from "@shared/lib/interim";
import {socket} from "@shared/lib/ws";
import {matchEvents} from "@shared/api/match";
import {authModel} from "@features/auth";
import {Actions} from "@shared/ui/molecules/actions";
import {useSnackbar} from "notistack";

interface LobbyPageParams {
  id: string;
}

export const LobbyPage: React.FC = () => {
  const dispatch = useDispatch();

  const credentials = useSelector(authModel.selectors.credentials)!;

  const lobby = useSelector(matchModel.selectors.lobby)!;

  const {id} = useParams<Partial<LobbyPageParams>>() as LobbyPageParams;

  const navigate = useNavigate();

  const [gameMode, setGameMode] = React.useState<GameMode>("default");

  const {enqueueSnackbar} = useSnackbar();

  const participant = lobby?.participants.find(
    (participant) => participant.id === credentials.id,
  );

  const isLeader = participant?.role === "leader";

  React.useEffect(() => {
    return () => {
      dispatch(matchModel.actions.leaveLobby({lobbyId: id}));
    };
  }, []);

  React.useEffect(() => {
    if (!lobby) {
      dispatch(matchModel.actions.joinLobby({lobbyId: id}))
        .unwrap()
        .then((res) => {
          dispatch(matchModel.actions.setLobby(res.lobby));

          dispatch(
            interimModel.actions.fetchUserSupplemental({
              ids: res.lobby.participants.map((participant) => participant.id),
            }),
          );
        })
        .catch(() => {
          navigate("/");
        });
    }
  }, []);

  React.useEffect(() => {
    if (lobby && !isLeader) setGameMode("custom");
  }, [lobby]);

  React.useEffect(() => {
    socket.on(matchEvents.client.PARTICIPANT_JOIN, ({participant}) => {
      dispatch(matchModel.actions.addPlayer(participant));
    });

    socket.on(matchEvents.client.PARTICIPANT_LEAVE, ({participantId}) => {
      dispatch(matchModel.actions.removeLobbyPlayer(participantId));
    });

    socket.on(matchEvents.client.LEADER_SWITCH, ({participantId}) => {
      dispatch(matchModel.actions.setRole({id: participantId, role: "leader"}));
    });

    socket.on(matchEvents.client.MATCH_START, ({match}) => {
      dispatch(matchModel.actions.setMatch(match));

      navigate(`/${match.id}`);
    });

    return () => {
      const events = [
        matchEvents.client.PARTICIPANT_JOIN,
        matchEvents.client.PARTICIPANT_LEAVE,
      ];

      events.forEach((event) => {
        socket.off(event);
      });
    };
  }, []);

  if (!lobby) return null;

  const handleGameModeChange = (mode: GameMode) => {
    let disabled: CardName[] = [];

    if (mode === "core") {
      disabled = [
        "alter-the-future-3x",
        "bury",
        "catomic-bomb",
        "draw-from-the-bottom",
        "imploding-kitten",
        "mark",
        "personal-attack",
        "reverse",
        "share-the-future-3x",
        "streaking-kitten",
        "super-skip",
        "swap-top-and-bottom",
        "targeted-attack",
      ];
    } else if (mode === "default") {
      disabled = [];
    } else if (mode === "custom") {
      disabled = [];
    }

    dispatch(
      matchModel.actions.updateDisabled({cards: disabled, lobbyId: lobby.id}),
    );

    dispatch(matchModel.actions.setDisabled(disabled));

    setGameMode(mode);
  };

  const handleStartButtonClick = () => {
    if (!(lobby.participants.length > 1)) return;

    dispatch(matchModel.actions.startMatch({lobbyId: lobby.id}))
      .unwrap()
      .then((res) => {
        dispatch(matchModel.actions.setMatch(res.match));

        navigate(`/${res.match.id}`);
      });
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

  return (
    <Fullscreen>
      <LobbySidebar>
        <Layout.Col h="100%" justify="space-between">
          <Layout.Col gap={5}>
            <Layout.Row align="center" gap={2}>
              <LobbyActions />

              <H3>private lobby</H3>
            </Layout.Row>

            <Layout.Col gap={1}>
              {lobby.participants.map((participant, idx) => {
                const isLeader = participant.role === "leader";

                return (
                  <Player key={idx}>
                    <Avatar
                      size={7}
                      src={participant.avatar}
                      variant="square"
                    />
                    <Layout.Col p={1} justify="space-between">
                      <Layout.Row align="center" gap={1}>
                        <Username>{participant.username}</Username>

                        <Layout.Row align="center" gap={0.5}>
                          {isLeader && <Badge>{participant.role}</Badge>}
                          <Badge>{participant.as}</Badge>
                        </Layout.Row>
                      </Layout.Row>

                      <Layout.Row align="center" gap={1}>
                        <TrophyIcon />
                        <Rating>{participant.rating}</Rating>
                      </Layout.Row>
                    </Layout.Col>
                  </Player>
                );
              })}
            </Layout.Col>

            <Layout.Row justify="space-between">
              {isLeader && (
                <Button
                  variant="contained"
                  endIcon={<StartIcon />}
                  onClick={handleStartButtonClick}
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

          <ChatPanel />
        </Layout.Col>
      </LobbySidebar>

      <Main>
        <Section gap={1}>
          {isLeader && (
            <>
              <H4>You are the host</H4>
              <Text color="secondary">
                This means only you can change the rules and start the game.
              </Text>
            </>
          )}

          {!isLeader && (
            <>
              <H4>waiting for host</H4>
              <Text color="secondary">
                The host (first player) starts the game. Only they can change
                the rules.
              </Text>
            </>
          )}
        </Section>

        {isLeader && (
          <Section gap={4}>
            <Layout.Col gap={1}>
              <H4>Game mode</H4>

              {isLeader ? (
                <Text color="secondary">
                  Select the preferable game mode with favourite cards.
                </Text>
              ) : (
                <Text color="secondary">
                  Only the host can change the game mode.
                </Text>
              )}
            </Layout.Col>

            <GameModeSelection
              handleModeChange={handleGameModeChange}
              mode={gameMode}
            />
          </Section>
        )}

        <Section gap={4}>
          <Layout.Col gap={1}>
            <H4>Active cards</H4>
            <Text color="primary">
              Select those cards that you want to be in the draw pile.
            </Text>
          </Layout.Col>

          <ActiveCards mode={gameMode} />
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

interface GameModeStyledProps {
  tone: string;
  active?: boolean;
}

type GameMode = "default" | "random" | "core" | "custom";

interface GameModeSelectionProps {
  mode: GameMode;
  handleModeChange: (mode: GameMode) => void;
}

const GameModeSelection: React.FC<GameModeSelectionProps> = ({
  handleModeChange,
  mode,
}) => (
  <Layout.Col gap={2}>
    <Layout.Row gap={2}>
      <GameMode
        tone="#00A800"
        gap={1}
        onClick={() => handleModeChange("default")}
        active={mode === "default"}
      >
        <ModeTitle>Default</ModeTitle>
        <ModeDescription>
          Casual game mode with some special cards.
        </ModeDescription>
      </GameMode>

      <GameMode
        tone="#42B0D1"
        gap={1}
        onClick={() => handleModeChange("core")}
        active={mode === "core"}
      >
        <ModeTitle>Core</ModeTitle>
        <ModeDescription>
          Casual game mode with some special cards.
        </ModeDescription>
      </GameMode>
    </Layout.Row>

    <Layout.Row gap={2}>
      {/* <GameMode
        tone="#FF6600"
        gap={1}
        onClick={() => handleModeChange("random")}
        active={mode === "random"}
      >
        <ModeTitle>Random</ModeTitle>
        <ModeDescription>
          Casual game mode with some special cards.
        </ModeDescription>
      </GameMode> */}

      <CustomGameMode
        tone="#555555"
        gap={1}
        onClick={() => handleModeChange("custom")}
        active={mode === "custom"}
      >
        <ModeTitle>Custom</ModeTitle>
        <ModeDescription>
          Fully customize your own game with special cards and rules.
        </ModeDescription>
      </CustomGameMode>
    </Layout.Row>
  </Layout.Col>
);

const GameMode = styled(Layout.Col)<GameModeStyledProps>`
  color: ${({theme}) => theme.palette.text.primary};
  max-width: 30rem;
  background-color: ${({theme}) => theme.palette.background.default};
  border: 2px solid ${({theme}) => theme.palette.divider};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: 0.2s linear;
  padding: 1.5rem 2rem;

  &:active {
    transform: scale(0.9);
    transform-origin: 50% 50%;
  }

  ${({active, tone}) =>
    active &&
    css`
      color: #ffffff !important;
      background-color: ${tone} !important;
    `}
`;

const CustomGameMode = styled(GameMode)`
  color: ${({theme}) => theme.palette.text.primary};
  background-color: #3c3d3f;
  border: none;

  &:hover {
    background-color: #555555;
  }
`;

const ModeTitle = styled(Text)`
  color: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const ModeDescription = styled(Text)`
  color: inherit;
  font-size: 1.4rem;
  text-transform: lowercase;
`;

interface ActiveCardsProps {
  mode: GameMode;
}

const ActiveCards: React.FC<ActiveCardsProps> = ({mode}) => {
  const dispatch = useDispatch();

  const credentials = useSelector(authModel.selectors.credentials)!;

  const lobby = useSelector(matchModel.selectors.lobby)!;

  React.useEffect(() => {
    socket.on(matchEvents.client.DISABLED_UPDATE, ({disabled}) => {
      dispatch(matchModel.actions.setDisabled(disabled));
    });
  }, []);

  const participant = lobby.participants.find(
    (participant) => participant.id === credentials.id,
  )!;

  const isLeader = participant.role === "leader";

  const isCore = mode === "core";
  const isRandom = mode === "random";
  const isCustom = mode === "custom";

  if (isCore)
    return (
      <Layout.Row>
        <Card name="exploding-kitten" />
        <Card name="defuse" />
        <Card name="see-the-future-3x" />
        <Card name="attack" />
        <Card name="nope" />
        <Card name="shuffle" />
        <Card name="skip" />
      </Layout.Row>
    );

  if (isRandom) return <Obscurity>???</Obscurity>;

  if (isCustom) {
    const toggle = (card: CardName) => {
      if (!isLeader) return;

      let updated = lobby.disabled;

      const isExcluded = updated.includes(card);

      if (isExcluded) updated = updated.filter((c) => c !== card);
      else updated = [...updated, card];

      dispatch(
        matchModel.actions.updateDisabled({cards: updated, lobbyId: lobby.id}),
      );

      dispatch(matchModel.actions.setDisabled(updated));
    };

    return (
      <Layout.Row>
        <Card name="exploding-kitten" />

        {cards.collection
          .filter((card) => card !== "exploding-kitten")
          .map((card, idx) => (
            <CardWrapper
              key={idx}
              interactive={isLeader}
              onClick={() => toggle(card)}
              excluded={lobby.disabled.includes(card)}
            >
              <Card key={idx} name={card} />
            </CardWrapper>
          ))}
      </Layout.Row>
    );
  }

  return (
    <Layout.Row>
      {cards.collection.map((card, idx) => (
        <Card key={idx} name={card} />
      ))}
    </Layout.Row>
  );
};

const Obscurity = styled(Text)`
  font-family: "Bungee", sans-serif;
  font-size: 5rem;
`;

interface CardWrapperStyledProps {
  excluded?: boolean;
  interactive?: boolean;
}

const CardWrapper = styled("div")<CardWrapperStyledProps>`
  transition: 0.2s linear;

  &:active {
    transform: scale(0.9);
    transform-origin: 50% 50%;
  }

  ${({excluded}) =>
    excluded &&
    css`
      filter: grayscale(1);
      opacity: 0.55;
    `}

  ${({interactive}) =>
    interactive &&
    css`
      cursor: pointer;
    `}
`;

const LobbySidebar = styled("aside")`
  width: 50rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({theme}) => theme.palette.background.paper};
  border-right: 1px solid ${({theme}) => theme.palette.divider};
  padding: 3rem;
`;

const BurgerIcon = styled(Icon.Burger)`
  width: 4rem;
  fill: ${({theme}) => theme.palette.text.primary};
  cursor: pointer;
`;

const Player = styled(Layout.Row)`
  width: 100%;
  background-color: ${({theme}) => theme.palette.background.default};
  border: 1px solid ${({theme}) => theme.palette.divider};
  border-radius: 1rem;
  border-bottom-left-radius: 3rem;
  border-top-left-radius: 3rem;
  overflow: hidden;
`;

const Username = styled(Text)`
  font-size: 1.6rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const StartIcon = styled(Icon.Start)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.primary.contrastText};
`;

const LinkIcon = styled(Icon.Link)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.primary};
`;

const Rating = styled(Text)`
  font-size: 1.6rem;
  font-weight: 700;
`;

const TrophyIcon = styled(Icon.Trophy)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.primary};
`;

const LobbyActions: React.FC = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const lobby = useSelector(matchModel.selectors.lobby)!;

  const [anchor, setAnchor] = React.useState<SVGElement | null>(null);

  const handleClick = (event: React.MouseEvent<SVGElement>) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleLeaveButtonClick = () => {
    dispatch(matchModel.actions.leaveLobby({lobbyId: lobby.id}))
      .unwrap()
      .then(() => {
        navigate("/");
      });
  };

  return (
    <>
      <BurgerIcon role="button" onClick={handleClick} />

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{horizontal: "left", vertical: "bottom"}}
      >
        <Actions.List>
          <Actions.Item icon={<CrossIcon />} onClick={handleLeaveButtonClick}>
            <LeaveText>leave</LeaveText>
          </Actions.Item>
        </Actions.List>
      </Popover>
    </>
  );
};

const LeaveText = styled(Text)`
  color: ${({theme}) => theme.palette.error.main};
  font-weight: 700;
`;

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
`;
