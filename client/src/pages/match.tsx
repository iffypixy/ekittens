import * as React from "react";
import {styled, Popover, keyframes, css} from "@mui/material";
import {useSelector} from "react-redux";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";

import {Card, UnknownCard} from "@entities/card";
import {Layout} from "@shared/lib/layout";
import {
  ExplodingKittenDefuseModal,
  ExplodingKittenInsertionModal,
  Deck,
  DrawPile,
  DiscardPile,
  SeeTheFutureModal,
  AlterTheFutureModal,
  ShareTheFutureModal,
  SharedCardsModal,
  BuryCardModal,
  ImplodingKittenInsertion,
  DefeatModal,
  VictoryModal,
  GameOverModal,
  ContextIndicator,
  ExplodingKittenProbability,
  StateTimer,
} from "@features/match";
import {Fullscreen} from "@shared/ui/templates";
import {Avatar, Badge, H3, Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import {chatModel, ChatPanel} from "@features/chat";
import {matchModel} from "@entities/match";
import {store, useDispatch} from "@app/store";
import {authModel} from "@features/auth";
import {socket} from "@shared/lib/ws";
import {matchEvents} from "@shared/api/match";
import {interimModel} from "@shared/lib/interim";
import {styling} from "@shared/lib/styling";
import {PreferencesModal} from "@features/preferences";
import {chatEvents} from "@shared/api/chat";
import {Actions} from "@shared/ui/molecules/actions";
import explodingkitten from "@shared/assets/cards/exploding-kitten.png";
import implodingkitten from "@shared/assets/cards/imploding-kitten.png";

interface MatchPageParams {
  id: string;
}

export const MatchPage: React.FC = () => {
  const {t} = useTranslation(["common", "match"]);

  const dispatch = useDispatch();

  const {id} = useParams<Partial<MatchPageParams>>() as MatchPageParams;
  const navigate = useNavigate();

  const credentials = useSelector(authModel.selectors.credentials)!;

  const match = useSelector(matchModel.selectors.match)!;

  const supplementals = useSelector(interimModel.selectors.supplementals);

  const [isEKDModalOpen, setIsEKDModalOpen] = React.useState(false);
  const [isEKIModalOpen, setIsEKIModalOpen] = React.useState(false);
  const [isSTFModalOpen, setIsSTFModalOpen] = React.useState(false);
  const [isATFModalOpen, setIsATFModalOpen] = React.useState(false);
  const [isSHTFModalOpen, setIsSHTFModalOpen] = React.useState(false);
  const [isSHTFNModalOpen, setIsSHTFNModalOpen] = React.useState(false);
  const [isBCModalOpen, setIsBCModalOpen] = React.useState(false);
  const [isIKIModalOpen, setIsIKIModalOpen] = React.useState(false);
  const [isDefeatModalOpen, setIsDefeatModalOpen] = React.useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = React.useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = React.useState(false);

  const isTurn = match?.players[match.turn]?.id === credentials.id;

  React.useEffect(() => {
    const isEKD = match?.state.type === "exploding-kitten-defuse" && isTurn;
    const isEKI = match?.state.type === "exploding-kitten-insertion" && isTurn;
    const isATF = match?.state.type === "future-cards-alter" && isTurn;
    const isSHTF = match?.state.type === "future-cards-share" && isTurn;
    const isBC = match?.state.type === "card-bury" && isTurn;
    const isIKI = match?.state.type === "imploding-kitten-insertion" && isTurn;

    if (isEKD) setIsEKDModalOpen(true);
    if (isEKI) setIsEKIModalOpen(true);
    if (isATF) setIsATFModalOpen(true);
    if (isSHTF) setIsSHTFModalOpen(true);
    if (isBC) setIsBCModalOpen(true);
    if (isIKI) setIsIKIModalOpen(true);
  }, [match?.state]);

  React.useEffect(() => {
    socket.on(matchEvents.client.SELF_VICTORY, ({shift, rating}) => {
      setIsVictoryModalOpen(true);
      dispatch(matchModel.actions.setResult({type: "victory", shift, rating}));
    });

    socket.on(matchEvents.client.VICTORY, () => {
      setIsGameOverModalOpen(true);
    });

    socket.on(
      matchEvents.client.SELF_PLAYER_DEFEAT,
      ({shift, reason, rating}) => {
        setIsEKDModalOpen(false);
        setIsDefeatModalOpen(true);

        const player = store
          .getState()
          .match.match!.players.find((player) => player.id === credentials.id)!;

        dispatch(matchModel.actions.removePlayer({playerId: player.id}));
        dispatch(matchModel.actions.addLoser({...player, reason}));
        dispatch(
          matchModel.actions.setResult({type: "defeat", shift, reason, rating}),
        );
      },
    );

    socket.on(matchEvents.client.PLAYER_DEFEAT, ({playerId, reason}) => {
      const player = store
        .getState()
        .match.match!.players.find((player) => player.id === playerId)!;

      dispatch(matchModel.actions.removePlayer({playerId: player.id}));
      dispatch(matchModel.actions.addLoser({...player, reason}));
    });

    socket.on(matchEvents.client.CARD_MARK, ({card, playerId}) => {
      dispatch(matchModel.actions.addMarked({card, playerId}));
    });

    socket.on(matchEvents.client.SELF_CARD_MARK, ({card}) => {
      const player = store
        .getState()
        .match.match!.players.find((player) => player.id === credentials.id)!;

      dispatch(matchModel.actions.addMarked({card, playerId: player.id}));
    });

    socket.on(matchEvents.client.IK_SPOT_CHANGE, ({spot}) => {
      dispatch(matchModel.actions.setContext({ikspot: spot}));
    });

    socket.on(matchEvents.client.EXPLODING_KITTEN_INSERT, () => {
      dispatch(matchModel.actions.incrementDrawCards());
    });

    socket.on(matchEvents.client.FUTURE_CARDS_RECEIVE, ({cards}) => {
      setIsSTFModalOpen(true);
      dispatch(matchModel.actions.setFuture(cards));
    });

    socket.on(matchEvents.client.SELF_FUTURE_CARDS_PLAYER_SHARE, ({cards}) => {
      setIsSHTFNModalOpen(true);
      dispatch(matchModel.actions.setFuture(cards));
    });

    socket.on(matchEvents.client.NOPED_CHANGE, ({noped, playerId, cardId}) => {
      dispatch(matchModel.actions.setContext({noped}));
      dispatch(matchModel.actions.addDiscardCard("nope"));

      if (playerId) {
        dispatch(matchModel.actions.decrementCardsNumber({playerId, cardId}));
      }
    });

    socket.on(matchEvents.client.REVERSED_CHANGE, ({reversed}) => {
      dispatch(matchModel.actions.setContext({reversed}));
    });

    socket.on(matchEvents.client.ATTACKS_CHANGE, ({attacks}) => {
      dispatch(matchModel.actions.setContext({attacks}));
    });

    socket.on(matchEvents.client.CARD_DRAW, ({playerId, cardId}) => {
      dispatch(matchModel.actions.decrementDrawCards());
      dispatch(matchModel.actions.incrementCardsNumber({playerId, cardId}));
    });

    socket.on(matchEvents.client.EXPLOSION, () => {
      dispatch(matchModel.actions.decrementDrawCards());
    });

    socket.on(matchEvents.client.SELF_CARD_DRAW, ({card}) => {
      dispatch(matchModel.actions.addCard(card));
      dispatch(matchModel.actions.decrementDrawCards());

      dispatch(
        matchModel.actions.incrementCardsNumber({
          playerId: credentials.id,
          cardId: card.id,
        }),
      );
    });

    socket.on(matchEvents.client.SELF_CARD_PLAY, ({card}) => {
      dispatch(
        matchModel.actions.decrementCardsNumber({
          playerId: credentials.id,
          cardId: card.id,
        }),
      );
    });

    socket.on(matchEvents.client.SELF_BOTTOM_CARD_DRAW, ({card}) => {
      dispatch(matchModel.actions.addCard(card));
      dispatch(matchModel.actions.decrementDrawCards());

      dispatch(
        matchModel.actions.incrementCardsNumber({
          playerId: credentials.id,
          cardId: card.id,
        }),
      );
    });

    socket.on(matchEvents.client.BOTTOM_CARD_DRAW, ({playerId, cardId}) => {
      dispatch(matchModel.actions.decrementDrawCards());
      dispatch(matchModel.actions.incrementCardsNumber({playerId, cardId}));
    });

    socket.on(matchEvents.client.CARD_PLAY, ({playerId, card}) => {
      dispatch(
        matchModel.actions.decrementCardsNumber({playerId, cardId: card.id}),
      );

      dispatch(matchModel.actions.addDiscardCard(card.name));
    });

    socket.on(matchEvents.client.STATE_CHANGE, ({state}) => {
      dispatch(matchModel.actions.setState({...state, at: Date.now()}));
    });

    socket.on(matchEvents.client.TURN_CHANGE, ({turn}) => {
      dispatch(matchModel.actions.setTurn(turn));
    });

    socket.on(matchEvents.client.NEW_SPECTATOR, ({user}) => {
      dispatch(matchModel.actions.addSpectator(user));
    });

    socket.on(matchEvents.client.SPECTATOR_LEAVE, ({userId}) => {
      dispatch(matchModel.actions.removeSpectator(userId));
    });

    socket.on(chatEvents.client.NEW_MESSAGE, ({message}) => {
      dispatch(chatModel.actions.addMessage(message));
    });

    return () => {
      const events = [
        chatEvents.client.NEW_MESSAGE,
        matchEvents.client.SELF_PLAYER_KICK,
        matchEvents.client.SELF_PLAYER_DEFEAT,
        matchEvents.client.SELF_PLAYER_LEAVE,
        matchEvents.client.SELF_PLAYER_DISCONNECT,
        matchEvents.client.SELF_CARD_DRAW,
        matchEvents.client.SELF_CARD_PLAY,
        matchEvents.client.CARD_DRAW,
        matchEvents.client.CARD_PLAY,
        matchEvents.client.STATE_CHANGE,
        matchEvents.client.TURN_CHANGE,
        matchEvents.client.SELF_VICTORY,
        matchEvents.client.NEW_SPECTATOR,
        matchEvents.client.SPECTATOR_LEAVE,
      ];

      events.forEach((event) => {
        socket.off(event);
      });
    };
  }, []);

  React.useEffect(() => {
    if (!match)
      dispatch(matchModel.actions.joinMatch({matchId: id}))
        .unwrap()
        .then((res) => {
          dispatch(chatModel.actions.joinChat({chatId: res.match.id}));

          dispatch(
            interimModel.actions.fetchUserSupplemental({
              ids: [
                ...res.match.players,
                ...res.match.out,
                ...res.match.spectators,
              ].map((participant) => participant.id),
            }),
          );
        })
        .catch(() => {
          dispatch(matchModel.actions.spectateMatch({matchId: id}))
            .unwrap()
            .then((res) => {
              dispatch(chatModel.actions.joinChat({chatId: res.match.id}));

              dispatch(
                interimModel.actions.fetchUserSupplemental({
                  ids: [
                    ...res.match.players,
                    ...res.match.out,
                    ...res.match.spectators,
                  ].map((participant) => participant.id),
                }),
              );
            })
            .catch(() => {
              navigate("/");
            });
        });
  }, []);

  if (!match) return null;

  return (
    <Fullscreen>
      <ExplodingKittenDefuseModal
        open={isEKDModalOpen}
        handleClose={() => setIsEKDModalOpen(false)}
      />

      <ExplodingKittenInsertionModal
        open={isEKIModalOpen && !isEKDModalOpen}
        handleClose={() => setIsEKIModalOpen(false)}
      />

      <SeeTheFutureModal
        open={isSTFModalOpen}
        handleClose={() => setIsSTFModalOpen(false)}
      />

      {isATFModalOpen && (
        <AlterTheFutureModal
          open={isATFModalOpen}
          handleClose={() => setIsATFModalOpen(false)}
        />
      )}

      {isSHTFModalOpen && (
        <ShareTheFutureModal
          open={isSHTFModalOpen}
          handleClose={() => setIsSHTFModalOpen(false)}
        />
      )}

      <SharedCardsModal
        open={isSHTFNModalOpen}
        handleClose={() => setIsSHTFNModalOpen(false)}
      />

      <BuryCardModal
        open={isBCModalOpen}
        handleClose={() => setIsBCModalOpen(false)}
      />

      <ImplodingKittenInsertion
        open={isIKIModalOpen}
        handleClose={() => setIsIKIModalOpen(false)}
      />

      <DefeatModal
        open={isDefeatModalOpen}
        handleClose={() => setIsDefeatModalOpen(false)}
      />

      <VictoryModal
        open={isVictoryModalOpen}
        handleClose={() => setIsVictoryModalOpen(false)}
      />

      <GameOverModal
        open={isGameOverModalOpen && !isDefeatModalOpen}
        handleClose={() => setIsGameOverModalOpen(false)}
      />

      <MatchSidebar>
        <Layout.Col h="100%" justify="space-between">
          <Layout.Col gap={5}>
            <Layout.Row align="center" gap={2}>
              <MatchActions />

              <H3>{t("sidebar-title", {ns: "match"})}</H3>
            </Layout.Row>

            <Layout.Col gap={1}>
              {[...match.players, ...match.out]
                .sort((a, b) => a.username.localeCompare(b.username))
                .map((participant) => {
                  return (
                    <Player key={participant.id}>
                      <Avatar
                        size={7}
                        src={participant.avatar}
                        online={
                          supplementals[participant.id]?.status === "online"
                        }
                        showStatus
                      />
                      <Layout.Col p={1} justify="space-between">
                        <Layout.Row align="center" gap={1}>
                          <Username>{participant.username}</Username>

                          <Layout.Row align="center" gap={0.5}>
                            <Badge>{t("badge.player", {ns: "match"})}</Badge>
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

              {match.spectators.map((spectator) => (
                <Player key={spectator.id}>
                  <Avatar
                    size={7}
                    src={spectator.avatar}
                    online={supplementals[spectator.id]?.status === "online"}
                    showStatus
                  />
                  <Layout.Col p={1} justify="space-between">
                    <Layout.Row align="center" gap={1}>
                      <Username>{spectator.username}</Username>

                      <Layout.Row align="center" gap={0.5}>
                        <Badge>{t("badge.spectator", {ns: "match"})}</Badge>
                      </Layout.Row>
                    </Layout.Row>
                  </Layout.Col>
                </Player>
              ))}
            </Layout.Col>
          </Layout.Col>

          <ChatPanel />
        </Layout.Col>
      </MatchSidebar>

      <Main>
        <Layout.Col h="100%" justify="space-between" align="center">
          <Header w="100%" justify="center" gap={5} p={3}>
            {[...match.players, ...match.out]
              .sort((a, b) => a.username.localeCompare(b.username))
              .map((player) => {
                const isTurn = match.players[match.turn]?.id === player.id;

                const isAD = match.state.type === "action-delay";

                const isEKD =
                  isTurn && match.state.type === "exploding-kitten-defuse";

                const isIKI =
                  isTurn && match.state.type === "imploding-kitten-insertion";

                const isActive =
                  (isTurn && !isAD) ||
                  (isTurn && isAD && match.context.noped) ||
                  (!isTurn && isAD);

                return (
                  <InGamePlayer key={player.id} gap={-2} active={isActive}>
                    <PlayerAvatarWrapper>
                      <InGamePlayerUsername>
                        {player.username}
                      </InGamePlayerUsername>

                      {player.reason ? (
                        <SkullIcon />
                      ) : (
                        <PlayerAvatar
                          size={15}
                          src={player.avatar}
                          active={isActive}
                        />
                      )}

                      {(isEKD || player.reason === "ek-explosion") && (
                        <ActionIndicator
                          src={explodingkitten}
                          animated={isEKD}
                        />
                      )}

                      {isIKI ||
                        (player.reason === "ik-explosion" && (
                          <ActionIndicator
                            src={implodingkitten}
                            animated={isIKI}
                          />
                        ))}
                    </PlayerAvatarWrapper>

                    {!player.reason && (
                      <Layout.Row gap={-0.5} style={{zIndex: 1}}>
                        {player.cards.map((id, idx) =>
                          player.marked.some((card) => card?.id === id) ? (
                            <Card
                              key={idx}
                              name={
                                player.marked.find((card) => card?.id === id)!
                                  .name
                              }
                              mini
                            />
                          ) : (
                            <UnknownCard key={idx} mini />
                          ),
                        )}
                      </Layout.Row>
                    )}
                  </InGamePlayer>
                );
              })}
          </Header>

          <Layout.Row w="100%" justify="space-around" align="center" p={3}>
            <Layout.Col gap={1}>
              <StateTimer />
              <ExplodingKittenProbability />
            </Layout.Col>

            <Layout.Row gap={5} align="flex-start">
              <DrawPile />
              <DiscardPile />
            </Layout.Row>

            <ContextIndicator />
          </Layout.Row>

          {match.as === "player" ? (
            <Deck />
          ) : (
            <Layout.Col w="100%" p={5} justify="center" align="center">
              <H3>you are a spectator</H3>
            </Layout.Col>
          )}
        </Layout.Col>
      </Main>
    </Fullscreen>
  );
};

const Main = styled("main")`
  height: 100%;
  flex: 1;
`;

const Header = styled(Layout.Row)`
  border-bottom: 2px dotted ${({theme}) => theme.palette.divider};
`;

const avatarpulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgb(184, 67, 44, 0.35);
  }

  100% {
    box-shadow: 0 0 0 3rem rgb(184, 67, 44, 0);
  }
`;

interface InGamePlayerStyledProps {
  active: boolean;
}

const SkullIcon = styled(Icon.Skull)`
  width: 15rem;
  fill: ${({theme}) => theme.palette.text.primary};
  border: 1rem solid ${({theme}) => theme.palette.text.primary};
  border-radius: 50%;
`;

const PlayerAvatar = styled(Avatar)<InGamePlayerStyledProps>`
  ${({active}) =>
    active &&
    css`
      animation: ${avatarpulse} 1s infinite;
    `}
`;

const PlayerAvatarWrapper = styled(Layout.Row)`
  position: relative;
`;

const InGamePlayer = styled(Layout.Col)<InGamePlayerStyledProps>`
  align-items: center;
  opacity: 0.35;

  ${({active}) =>
    active &&
    css`
      opacity: 1;
    `}
`;

const InGamePlayerUsername = styled(Text)`
  color: #ffffff;
  font-family: "Bungee", sans-serif;
  font-size: 1.8rem;
  background-color: #000000;
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
`;

const MatchSidebar = styled("aside")`
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

const Rating = styled(Text)`
  font-size: 1.6rem;
  font-weight: 700;
`;

const TrophyIcon = styled(Icon.Trophy)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.primary};
`;

const MatchActions: React.FC = () => {
  const {t} = useTranslation(["common"]);

  const dispatch = useDispatch();

  const match = useSelector(matchModel.selectors.match)!;

  const navigate = useNavigate();

  const [isPreferencesModalOpen, setIsPreferencesModalOpen] =
    React.useState(false);

  const [anchor, setAnchor] = React.useState<SVGElement | null>(null);

  const handleClick = (event: React.MouseEvent<SVGElement>) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleLeaveButtonClick = () => {
    if (match.as === "player") {
      dispatch(matchModel.actions.leaveMatchAsPlayer({matchId: match.id}))
        .unwrap()
        .then(() => {
          navigate("/");
        });
    } else if (match.as === "spectator") {
      dispatch(matchModel.actions.leaveMatchAsSpectator({matchId: match.id}))
        .unwrap()
        .then(() => {
          navigate("/");
        });
    }
  };

  return (
    <>
      <PreferencesModal
        open={isPreferencesModalOpen}
        handleClose={() => setIsPreferencesModalOpen(false)}
      />

      <BurgerIcon role="button" onClick={handleClick} />

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{horizontal: "left", vertical: "bottom"}}
      >
        <Actions.List>
          <SettingsAction
            icon={<SettingsIcon />}
            onClick={() => setIsPreferencesModalOpen(true)}
          >
            <SettingsText>{t("w.preferences")}</SettingsText>
          </SettingsAction>

          <Actions.Item icon={<CrossIcon />} onClick={handleLeaveButtonClick}>
            <LeaveText>{t("w.leave")}</LeaveText>
          </Actions.Item>
        </Actions.List>
      </Popover>
    </>
  );
};

const LeaveText = styled(Text)`
  color: ${({theme}) => theme.palette.error.main};
  font-weight: 700;
  font-size: 1.4rem;
`;

const SettingsText = styled(Text)`
  color: currentColor;
  font-weight: 700;
  font-size: 1.4rem;
`;

const SettingsAction = styled(Actions.Item)`
  color: ${({theme}) => theme.palette.text.primary};

  &:hover {
    color: ${({theme}) => theme.palette.background.default};
  }
`;

const SettingsIcon = styled(Icon.Settings)`
  width: 2rem;
  fill: currentColor;
`;

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
`;

interface ActionIndicatorStyledProps {
  animated: boolean;
}

const ActionIndicator = styled("img")<ActionIndicatorStyledProps>`
  width: 8rem;
  position: absolute;
  left: 18%;
  right: 0;
  bottom: 0;
  top: 0;
  margin: auto;
  margin-bottom: -2rem;
  z-index: 2;

  ${({animated}) =>
    animated &&
    css`
      width: 10rem;
      animation: ${styling.mixins.pulse} 750ms infinite;
      margin-bottom: 0;
    `}
`;
