import * as React from "react";
import {styled, css} from "@mui/material";
import {useSelector, batch} from "react-redux";
import {Navigate} from "react-router-dom";
import Draggable, {DraggableEventHandler} from "react-draggable";

import {CenterTemplate, FullScreenTemplate} from "@shared/ui/templates";
import {Col, Row} from "@shared/lib/layout";
import {Avatar, Icon, Text} from "@shared/ui/atoms";
import {matchModel} from "@features/match";
import {avatars} from "@shared/lib/avatars";
import {socket} from "@shared/lib/websocket";
import {useDispatch} from "@shared/lib/store";
import {matchEvents} from "@shared/api/match.api";
import {Card} from "@entities/card";

export const MatchPage: React.FC = () => {
  const dispatch = useDispatch();

  const match = useSelector(matchModel.selectors.match);
  const cards = useSelector(matchModel.selectors.cards)!;

  React.useEffect(() => {
    socket.on(matchEvents.client.PLAYER_KICKED, ({playerId}) => {
      batch(() => {
        dispatch(
          matchModel.actions.updatePlayer({playerId, update: {kicked: true}}),
        );

        dispatch(matchModel.actions.continueTurn());
      });
    });

    socket.on(matchEvents.client.TURN_CHANGE, ({turn}) => {
      dispatch(matchModel.actions.updateMatch({turn}));
    });

    socket.on(matchEvents.client.PLAYER_DEFEATED, ({playerId}) => {
      batch(() => {
        dispatch(
          matchModel.actions.updatePlayer({playerId, update: {defeated: true}}),
        );

        dispatch(matchModel.actions.continueTurn());
      });
    });

    socket.on(matchEvents.client.KICKED, () => {
      batch(() => {
        dispatch(
          matchModel.actions.updatePlayer({
            playerId: socket.id,
            update: {kicked: true},
          }),
        );

        dispatch(matchModel.actions.continueTurn());
      });
    });

    socket.on(matchEvents.client.DEFEAT, () => {
      batch(() => {
        dispatch(
          matchModel.actions.updatePlayer({
            playerId: socket.id,
            update: {defeated: true},
          }),
        );

        dispatch(matchModel.actions.continueTurn());
      });
    });
  }, []);

  const [position, setPosition] = React.useState({x: 0, y: 0});

  if (!match) return <Navigate to="/" />;

  const active = match.players.filter(
    (player) => !player.kicked && !player.defeated,
  );

  const player = match.players.find((player) => player.id === socket.id)!;

  const handleDrop = () => {
    setPosition({x: 0, y: 0});

    dispatch(matchModel.actions.drawCard({matchId: match.id}));
  };

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPosition({x: data.x, y: data.y});
  };

  return (
    <FullScreenTemplate>
      <CenterTemplate>
        <Wrapper gap={6} align="center">
          <Row gap={3}>
            {match.players
              .filter((p) => p.id !== player.id)
              .map(({id, avatar, username, kicked, defeated}) => (
                <Player
                  key={id}
                  avatar={avatars[avatar]}
                  name={username}
                  isTurn={active[match.turn].id === id}
                  isDefeated={!!defeated}
                  isKicked={!!kicked}
                />
              ))}
          </Row>

          <Row gap={5}>
            <DeckBox>
              <AlternativeDeck align="center" justify="center">
                <DeckIcon name="question" />
              </AlternativeDeck>

              <Draggable
                onStop={handleDrop}
                onDrag={handleDrag}
                position={position}
              >
                <Col w="100%" h="100%">
                  <Deck align="center" justify="center">
                    <DeckIcon name="question" />
                  </Deck>
                </Col>
              </Draggable>
            </DeckBox>

            <PileBox justify="center" align="center">
              {match.pile.length ? (
                <Card type={match.pile[match.pile.length - 1]} amount={1} />
              ) : (
                <Text size={3.4} secondary>
                  Play cards here
                </Text>
              )}
            </PileBox>
          </Row>

          <Profile
            avatar={avatars[player.avatar]}
            isKicked={!!player.kicked}
            isDefeated={!!player.defeated}
            isTurn={active[match.turn].id === player.id}
            name="You"
          />

          <Row gap={1}>
            {cards.map((card, idx) => (
              <Card key={idx} type={card} amount={1} />
            ))}
          </Row>
        </Wrapper>
      </CenterTemplate>
    </FullScreenTemplate>
  );
};

const Wrapper = styled(Col)``;

interface PlayerProps {
  name: string;
  avatar: string;
  isKicked: boolean;
  isTurn: boolean;
  isDefeated: boolean;
  className?: string;
}

const Player: React.FC<PlayerProps> = ({
  name,
  avatar,
  className,
  isKicked,
  isTurn,
  isDefeated,
}) => (
  <PlayerWrapper
    isHighlighted={isTurn}
    isCrossed={isKicked || isDefeated}
    className={className}
  >
    <Avatar size="100%" src={avatar} alt={`${name}'s avatar`} />
    <PlayerText secondary>{name}</PlayerText>
  </PlayerWrapper>
);

interface PlayerStylingProps {
  isCrossed: boolean;
  isHighlighted: boolean;
}

const PlayerWrapper = styled(Col, {
  shouldForwardProp: (prop: string) =>
    !["isCrossed", "isHighlighted"].includes(prop),
})<PlayerStylingProps>`
  width: 20rem;
  height: 20rem;
  border-radius: 50%;
  position: relative;

  ${({isHighlighted}) =>
    isHighlighted &&
    css`
      box-shadow: 0 0 1rem 0.5rem #f00;
    `}

  ${({isCrossed}) =>
    isCrossed &&
    css`
      &::before,
      &::after {
        right: 50%;
        content: "";
        width: 1rem;
        height: 100%;
        background-color: #ffffff;
        z-index: 1;
        position: absolute;
      }
      &::before {
        transform: rotate(45deg);
      }
      &::after {
        transform: rotate(-45deg);
      }
    `}
`;

const PlayerText = styled(Text)`
  background-color: #000000;
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
`;

const Deck = styled(Col)`
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom left, #ed1b24, #e75480);
  box-shadow: 0 0 1rem 1px #f4b14d;
  border-radius: 1rem;
  cursor: pointer;
`;

const DeckIcon = styled(Icon)`
  width: 15rem;
  fill: #f4b14d;
`;

const DeckBox = styled(Col)`
  width: 20rem;
  height: 25rem;
  position: relative;
`;

const AlternativeDeck = styled(Deck)`
  position: absolute;
  top: 0;
  left: 0;
`;

const PileBox = styled(Col)`
  width: 20rem;
  height: 25rem;
  background-color: #000000;
  border-radius: 1rem;
  text-align: center;
`;

const Profile = styled(Player)`
  position: absolute;
  bottom: 3rem;
  left: 3rem;
`;
