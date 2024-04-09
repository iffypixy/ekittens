import React from "react";
import {styled} from "@mui/material";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";

import {useDispatch} from "@app/store";
import {userModel} from "@entities/user";
import {MATCH_STATE} from "@entities/match";
import {viewerModel} from "@entities/viewer";
import {
  DiscardPile,
  ContextIndicator,
  ExplodingKittenProbability,
  StateTimer,
  Players,
  currentMatchModel,
} from "@features/current-match";
import {chatModel, ChatPanel} from "@features/chat";
import {
  DefuseExplodingKittenModal,
  inGameInteractionsModel,
  InsertExplodingKittenModal,
  InsertImplodingKittenModal,
  AlterTheFutureModal,
  BuryCardModal,
  MarkCardModal,
  SeeTheFutureModal,
  SelectPlayerModal,
  ShareTheFutureModal,
  SharedCardsModal,
  MODAL,
} from "@features/current-match/in-game-interactions";
import {
  DefeatModal,
  GameOverModal,
  VictoryModal,
} from "@features/current-match/match-results";
import {MatchActions} from "@features/current-match/match-interactions";
import {DrawPile} from "@features/current-match/card-draw";
import {Deck} from "@features/current-match/card-play";
import {joinMatchModel} from "@features/join-match";

import {Fullscreen} from "@shared/ui/templates";
import {Avatar, Badge, H3, Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import {ws} from "@shared/lib/ws";
import {Layout} from "@shared/lib/layout";
import {OngoingMatch, User} from "@shared/api/common";

interface MatchPageParams {
  id: string;
}

export const MatchPage: React.FC = () => {
  const dispatch = useDispatch();

  const {id} = useParams<Partial<MatchPageParams>>() as MatchPageParams;

  const navigate = useNavigate();

  const credentials = viewerModel.useCredentials();

  const match = currentMatchModel.useMatch();

  const type = match?.state.type;

  const isTurn = !!(match?.players[match.turn]?.id === credentials.id);

  const {handlers} = currentMatchModel.useWsHandlers();

  React.useEffect(() => {
    dispatch(chatModel.actions.resetChat());
  }, []);

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
    const fetch = (match: OngoingMatch) => {
      dispatch(currentMatchModel.actions.setMatch({match}));

      dispatch(
        chatModel.actions.joinChat({
          chatId: match.id,
        }),
      );

      const ids = [...match.players, ...match.out, ...match.spectators].map(
        (participant) => participant.id,
      );

      dispatch(userModel.actions.fetchInterim({ids}));
    };

    dispatch(joinMatchModel.actions.joinAsPlayer({matchId: id}))
      .unwrap()
      .then((res) => {
        fetch(res.match);
      })
      .catch(() => {
        dispatch(
          joinMatchModel.actions.joinAsSpectator({
            matchId: id,
          }),
        )
          .unwrap()
          .then((res) => {
            fetch(res.match);
          })
          .catch(() => {
            navigate("/");
          });
      });
  }, []);

  React.useEffect(() => {
    dispatch(inGameInteractionsModel.actions.resetModals());
  }, []);

  React.useEffect(() => {
    if (type === MATCH_STATE.DEK && isTurn) {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.DEFUSE_EXPLODING_KITTEN,
          data: {
            open: true,
          },
        }),
      );
    } else if (type === MATCH_STATE.IEK && isTurn) {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.INSERT_EXPLODING_KITTEN,
          data: {
            open: true,
          },
        }),
      );
    } else if (type === MATCH_STATE.ATF && isTurn) {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.ALTER_THE_FUTURE,
          data: {
            open: true,
            payload: {cards: match?.state.payload.cards},
          },
        }),
      );
    } else if (type === MATCH_STATE.STF && isTurn) {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.SHARE_THE_FUTURE,
          data: {
            open: true,
            payload: {cards: match?.state.payload.cards},
          },
        }),
      );
    } else if (type === MATCH_STATE.BC && isTurn) {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.BURY_CARD,
          data: {
            open: true,
            payload: {card: match?.state.payload.card},
          },
        }),
      );
    } else if (type === MATCH_STATE.IIK && isTurn) {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.INSERT_IMPLODING_KITTEN,
          data: {
            open: true,
          },
        }),
      );
    }
  }, [match?.state.type, match?.state.payload, match?.state.at]);

  if (!match) return null;

  return (
    <Fullscreen>
      <DefuseExplodingKittenModal />
      <InsertExplodingKittenModal />
      <SeeTheFutureModal />
      <AlterTheFutureModal />
      <ShareTheFutureModal />
      <SharedCardsModal />
      <BuryCardModal />
      <InsertImplodingKittenModal />
      <MarkCardModal />
      <SelectPlayerModal />

      <DefeatModal />
      <VictoryModal />
      <GameOverModal />

      <Sidebar
        players={[...match.players, ...match.out]}
        spectators={match.spectators}
      />

      <Game as={match.as} />
    </Fullscreen>
  );
};

const Main = styled("main")`
  width: calc(100% - 50rem);
  height: 100%;
`;

interface SidebarProps {
  players: User[];
  spectators: User[];
}

const Sidebar: React.FC<SidebarProps> = ({players, spectators}) => {
  const {t} = useTranslation(["common", "match"]);

  const interims = userModel.useInterims();

  return (
    <Aside>
      <Layout.Col h="100%" justify="space-between">
        <Layout.Col gap={5}>
          <Layout.Row align="center" gap={2}>
            <MatchActions />

            <H3>{t("sidebar-title", {ns: "match"})}</H3>
          </Layout.Row>

          <Layout.Col gap={1}>
            {players
              .sort((a, b) => a.username.localeCompare(b.username))
              .map((participant) => {
                return (
                  <Player key={participant.id}>
                    <Avatar
                      size={7}
                      src={participant.avatar}
                      status={interims[participant.id]?.status}
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

                        <Text size={1.6} weight={700}>
                          {participant.rating}
                        </Text>
                      </Layout.Row>
                    </Layout.Col>
                  </Player>
                );
              })}

            {spectators.map((spectator) => (
              <Player key={spectator.id}>
                <Avatar
                  size={7}
                  src={spectator.avatar}
                  status={interims[spectator.id]?.status}
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
    </Aside>
  );
};

const Aside = styled("aside")`
  width: 50rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: ${({theme}) => theme.palette.background.paper};
  border-right: 1px solid ${({theme}) => theme.palette.divider};
  padding: 3rem;
`;

const Player = styled(Layout.Row)`
  width: 100%;
  background-color: ${({theme}) => theme.palette.background.default};
  border: 1px solid ${({theme}) => theme.palette.divider};
  border-radius: 10px;
  border-bottom-left-radius: 30px;
  border-top-left-radius: 30px;
  overflow: hidden;
`;

const Username = styled(Text)`
  font-size: 1.6rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const TrophyIcon = styled(Icon.Trophy)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.primary};
`;

interface GameProps {
  as: OngoingMatch["as"];
}

const Game: React.FC<GameProps> = ({as}) => (
  <Main>
    <Layout.Col h="100%" justify="space-between" align="center">
      <Players />

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

      {as === "player" ? (
        <Deck />
      ) : (
        <Layout.Col w="100%" p={5} justify="center" align="center">
          <H3>you are a spectator</H3>
        </Layout.Col>
      )}
    </Layout.Col>
  </Main>
);
