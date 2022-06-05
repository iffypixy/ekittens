import * as React from "react";
import {styled, css, Modal} from "@mui/material";
import {useSelector, batch} from "react-redux";
import {Navigate, useNavigate} from "react-router-dom";
import Draggable, {DraggableEventHandler} from "react-draggable";

import {CenterTemplate, FullScreenTemplate} from "@shared/ui/templates";
import {Col, Row} from "@shared/lib/layout";
import {Avatar, Button, Icon, Input, Text, Timer} from "@shared/ui/atoms";
import {matchModel} from "@features/match";
import {avatars} from "@shared/lib/avatars";
import {socket} from "@shared/lib/websocket";
import {useDispatch} from "@shared/lib/store";
import {matchEvents} from "@shared/api/match.api";
import {Card, CardProps, CardType} from "@entities/card";

let stopId: NodeJS.Timer | null = null;

export const MatchPage: React.FC = () => {
  const dispatch = useDispatch();

  const match = useSelector(matchModel.selectors.match);
  const cards = useSelector(matchModel.selectors.cards)!;

  const [winnerId, setWinnerId] = React.useState<string | null>(null);
  const [defuserId, setDefuserId] = React.useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = React.useState<string | null>(
    null,
  );
  const [followingCards, setFollowingCards] = React.useState<CardType[]>([]);

  React.useEffect(() => {
    socket.off(matchEvents.client.PLAYER_KICKED);
    socket.off(matchEvents.client.TURN_CHANGE);
    socket.off(matchEvents.client.PLAYER_DEFEATED);
    socket.off(matchEvents.client.KICKED);
    socket.off(matchEvents.client.DEFEAT);
    socket.off(matchEvents.client.CARD_DREW);
    socket.off(matchEvents.client.CARD_PLAYED);
    socket.off(matchEvents.client.VICTORY);
    socket.off(matchEvents.client.EXPLODING_KITTEN_SET);
    socket.off(matchEvents.client.EXPLODING_KITTEN_DREW);
    socket.off(matchEvents.client.EXPLOSION_DEFUSED);
    socket.off(matchEvents.client.PLAYED_CARD);
    socket.off(matchEvents.client.FOLLOWING_CARDS);
    socket.off(matchEvents.client.DREW_EXPLODING_KITTEN);
    socket.off(matchEvents.client.ATTACKS_CHANGE);
    socket.off(matchEvents.client.NOPE_CHANGE);
    socket.off(matchEvents.client.DEFUSED);
    socket.off(matchEvents.client.EXPLODING_KITTEN_SPOT_REQUEST);
    socket.off(matchEvents.client.EXPLODING_KITTEN_SPOT_REQUESTED);
    socket.off(matchEvents.client.SET_EXPLODING_KITTEN);
    socket.off(matchEvents.client.MESSAGE);

    socket.on(matchEvents.client.MESSAGE, ({message, username}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: false,
            text: `${username}: ${message}`,
          },
        }),
      );
    });

    socket.on(matchEvents.client.SET_EXPLODING_KITTEN, () => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: "You have inserted the exploding kitten.",
          },
        }),
      );
    });

    socket.on(
      matchEvents.client.EXPLODING_KITTEN_SPOT_REQUESTED,
      ({username}) => {
        dispatch(
          matchModel.actions.addMessage({
            message: {
              isSystem: true,
              text: `${username} is requsted to insert an exploding kitten.`,
            },
          }),
        );
      },
    );

    socket.on(matchEvents.client.EXPLODING_KITTEN_SPOT_REQUEST, () => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: "You are requested to insert an exploding kitten.",
          },
        }),
      );
    });

    socket.on(matchEvents.client.DEFUSED, () => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: "You defused the exploding kitten!",
          },
        }),
      );
    });

    socket.on(matchEvents.client.ATTACKS_CHANGE, ({attacks}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `Attacks quantity is now ${attacks}.`,
          },
        }),
      );
    });

    socket.on(matchEvents.client.NOPE_CHANGE, ({nope}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `Nope is now ${nope}.`,
          },
        }),
      );
    });

    socket.on(matchEvents.client.DREW_EXPLODING_KITTEN, () => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: "You drew an exploding kitten!",
          },
        }),
      );
    });

    socket.on(matchEvents.client.FOLLOWING_CARDS, ({cards}) => {
      setFollowingCards(cards);

      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: "You are provided the following 3 cards.",
          },
        }),
      );
    });

    socket.on(matchEvents.client.EXPLOSION_DEFUSED, ({username}) => {
      setDefuserId(null);
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `${username} has defused the exploding kitten.`,
          },
        }),
      );
    });

    socket.on(matchEvents.client.PLAYER_KICKED, ({playerId, username}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `${username} has been kicked for inactive.`,
          },
        }),
      );

      batch(() => {
        dispatch(
          matchModel.actions.updatePlayer({playerId, update: {kicked: true}}),
        );

        dispatch(matchModel.actions.continueTurn());
      });
    });

    socket.on(matchEvents.client.TURN_CHANGE, ({turn, username}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `Now it is ${username}'s turn.`,
          },
        }),
      );

      dispatch(matchModel.actions.updateMatch({turn}));
    });

    socket.on(matchEvents.client.PLAYED_CARD, ({playerId, card}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `You have played ${card} card.`,
          },
        }),
      );

      setCurrentPlayerId(playerId);
    });

    socket.on(matchEvents.client.PLAYER_DEFEATED, ({playerId, username}) => {
      setDefuserId(null);

      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `${username} has been exploded.`,
          },
        }),
      );

      batch(() => {
        dispatch(
          matchModel.actions.updatePlayer({playerId, update: {defeated: true}}),
        );

        dispatch(matchModel.actions.continueTurn());
      });
    });

    socket.on(matchEvents.client.KICKED, () => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: "You have been kicked for ianctive.",
          },
        }),
      );

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
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: "You have been exploded.",
          },
        }),
      );

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

    socket.on(matchEvents.client.EXPLODING_KITTEN_SET, ({username}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `${username} has inserted an exploding kitten.`,
          },
        }),
      );

      dispatch(matchModel.actions.incrementLeft());
    });

    socket.on(matchEvents.client.CARD_DREW, ({username}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `${username} drew a card.`,
          },
        }),
      );

      dispatch(matchModel.actions.decrementLeft());
    });

    socket.on(matchEvents.client.CARD_PLAYED, ({card, playerId, username}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `${username} played a ${card} card.`,
          },
        }),
      );

      dispatch(matchModel.actions.addPileCard({card}));
      setCurrentPlayerId(playerId);
      if (stopId) clearTimeout(stopId);

      dispatch(matchModel.actions.updateMatch({stopped: true}));

      stopId = setTimeout(() => {
        dispatch(matchModel.actions.updateMatch({stopped: false}));
      }, 5000);
    });

    socket.on(
      matchEvents.client.EXPLODING_KITTEN_DREW,
      ({playerId, username}) => {
        setDefuserId(playerId);

        dispatch(
          matchModel.actions.addMessage({
            message: {
              isSystem: true,
              text: `${username} drew an exploding kitten.`,
            },
          }),
        );
      },
    );

    socket.on(matchEvents.client.VICTORY, ({playerId, username}) => {
      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: true,
            text: `${username} is the winner.`,
          },
        }),
      );

      setWinnerId(playerId);
    });
  }, []);

  const navigate = useNavigate();

  const [position, setPosition] = React.useState({x: 0, y: 0});

  if (!match) return <Navigate to="/" />;

  const active = match.players.filter(
    (player) => !player.kicked && !player.defeated,
  );

  const player = match.players.find((player) => player.id === socket.id)!;

  const winner = match.players.find((player) => player.id === winnerId);

  const isTurn = active[match.turn].id === player.id && !winnerId;

  const handleDrop = () => {
    setPosition({x: 0, y: 0});

    if (isTurn) {
      dispatch(matchModel.actions.drawCard({matchId: match.id}));
      dispatch(matchModel.actions.decrementLeft());
    }
  };

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPosition({x: data.x, y: data.y});
  };

  return (
    <>
      {winner && (
        <Modal onClose={() => navigate("/")} open={!!winner}>
          <ModalWrapper>
            <ModalText secondary size={4}>
              {player.id === winner!.id
                ? "You have won! Congratulations!"
                : `${winner!.username} has won! GG.`}
            </ModalText>
          </ModalWrapper>
        </Modal>
      )}

      {!!followingCards.length && (
        <Modal
          onClose={() => setFollowingCards([])}
          open={!!followingCards.length}
        >
          <ModalWrapper>
            <Row gap={3}>
              {[...followingCards].reverse().map((card, idx) => (
                <Card key={idx} type={card} amount={1} />
              ))}
            </Row>
          </ModalWrapper>
        </Modal>
      )}

      <FullScreenTemplate>
        <Template>
          <Wrapper gap={6} align="center">
            {match.hasToChooseSpot ? (
              <>
                <SpotText>Choose a spot for exploding kitten</SpotText>

                <Row w="50%" align="center" justify="center">
                  <Button
                    style={{margin: "2rem"}}
                    onClick={() => {
                      dispatch(
                        matchModel.actions.setCardSpot({
                          matchId: match.id,
                          spot: match.left - 1,
                        }),
                      );

                      dispatch(matchModel.actions.incrementLeft());
                    }}
                  >
                    On the top
                  </Button>
                  {Array.from({length: match.left - 2}).map((_, idx) => (
                    <Button
                      style={{margin: "2rem"}}
                      onClick={() => {
                        dispatch(
                          matchModel.actions.setCardSpot({
                            matchId: match.id,
                            spot: idx + 1,
                          }),
                        );

                        dispatch(matchModel.actions.incrementLeft());
                      }}
                      key={idx}
                    >
                      On the {idx + 2}th spot
                    </Button>
                  ))}
                  <Button
                    style={{margin: "2rem"}}
                    onClick={() => {
                      dispatch(
                        matchModel.actions.setCardSpot({
                          matchId: match.id,
                          spot: 0,
                        }),
                      );

                      dispatch(matchModel.actions.incrementLeft());
                    }}
                  >
                    On the bottom
                  </Button>
                </Row>
              </>
            ) : match.hasToDefuse ? (
              <>
                <DefuseText>Defuse the exploding kitten</DefuseText>

                <Row align="center" justify="center" gap={5}>
                  <Card
                    w={20}
                    h={25}
                    type="exploding-kitten"
                    amount={1}
                    special="exploding-kitten"
                  />
                  <Card
                    w={20}
                    h={25}
                    id="pile"
                    type="defuse"
                    amount={1}
                    special="defuse"
                  />
                </Row>
              </>
            ) : (
              <>
                <Row gap={3}>
                  {match.players
                    .filter((p) => p.id !== player.id)
                    .map(({id, avatar, username, kicked, defeated}) => (
                      <Player
                        key={id}
                        avatar={avatars[avatar]}
                        isDefuser={id === defuserId}
                        name={username}
                        isPlayer={id === currentPlayerId}
                        isToAct={!!match.stopped}
                        isTurn={active[match.turn].id === id && !winnerId}
                        isDefeated={!!defeated}
                        isKicked={!!kicked}
                      />
                    ))}
                </Row>

                <Row gap={5}>
                  <Col gap={2} align="center">
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

                    <Text>{match.left} cards left</Text>
                  </Col>

                  <PileBox id="pile" justify="center" align="center">
                    {match.pile.length ? (
                      <Card
                        type={match.pile[match.pile.length - 1]}
                        amount={1}
                      />
                    ) : (
                      <PileText secondary>Play cards here</PileText>
                    )}
                  </PileBox>
                </Row>
              </>
            )}

            <Row gap={-3} justify="center">
              {cards.map((card, idx) => (
                <DeckCard
                  key={idx}
                  type={card}
                  amount={1}
                  opacity={
                    card === "nope" && !match.stopped
                      ? 0.25
                      : card === "nope" && match.stopped
                      ? 1
                      : card !== "nope" && match.stopped
                      ? 0.25
                      : card !== "nope" && !match.stopped
                      ? 1
                      : 1
                  }
                />
              ))}
            </Row>

            <Chat />

            <Profile
              isToAct={!!match.stopped}
              avatar={avatars[player.avatar]}
              isKicked={!!player.kicked}
              isDefuser={!!match.hasToDefuse}
              isDefeated={!!player.defeated}
              isPlayer={player.id === currentPlayerId}
              isTurn={isTurn}
              name="You"
            />
          </Wrapper>
        </Template>
      </FullScreenTemplate>
    </>
  );
};

const Wrapper = styled(Col)``;

interface PlayerProps {
  name: string;
  avatar: string;
  isKicked: boolean;
  isTurn: boolean;
  isDefeated: boolean;
  isDefuser: boolean;
  isToAct: boolean;
  isPlayer: boolean;
  className?: string;
}

const Player: React.FC<PlayerProps> = ({
  name,
  avatar,
  className,
  isKicked,
  isDefuser,
  isPlayer,
  isTurn,
  isDefeated,
  isToAct,
}) => {
  let timer: any = null;

  if (isDefuser) {
    timer = <PlayerTimer seconds={10} />;
  } else if (isToAct && !isPlayer) {
    timer = <PlayerTimer seconds={5} />;
  } else if (isToAct && isPlayer) {
    timer = null;
  } else if (isTurn) {
    timer = (
      <span>
        <PlayerTimer seconds={15} />
      </span>
    );
  }

  return (
    <PlayerWrapper
      isCrossed={isKicked || isDefeated}
      isClear={(isTurn && !isToAct) || (isToAct && !isPlayer)}
      className={className}
    >
      <Avatar size="100%" src={avatar} alt={`${name}'s avatar`} />
      <PlayerText ellipsis secondary>
        {name}
      </PlayerText>
      {timer}
    </PlayerWrapper>
  );
};

interface ChatProps {
  className?: string;
}

const Chat: React.FC<ChatProps> = ({className}) => {
  const dispatch = useDispatch();

  const [text, setText] = React.useState("");

  const messages = useSelector(matchModel.selectors.messages);
  const match = useSelector(matchModel.selectors.match);

  const player = match!.players.find((player) => player.id === socket.id);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (text) {
      dispatch(
        matchModel.actions.sendMessage({message: text, matchId: match!.id}),
      );

      dispatch(
        matchModel.actions.addMessage({
          message: {
            isSystem: false,
            text: `${player!.username}: ${text}`,
          },
        }),
      );

      setText("");
    }
  };

  return (
    <ChatForm onSubmit={handleSubmit}>
      <ChatWrapper gap={3} className={className}>
        <ChatList h="100%" gap={1}>
          {messages.map(({isSystem, text}) =>
            !isSystem ? (
              <UserMessage ellipsis>{text}</UserMessage>
            ) : (
              <SystemMessage ellipsis>{text}</SystemMessage>
            ),
          )}
        </ChatList>
        <ChatInput
          placeholder="Enter your message"
          value={text}
          onChange={({currentTarget}) => setText(currentTarget.value)}
        />
      </ChatWrapper>
    </ChatForm>
  );
};

const ChatWrapper = styled(Col)`
  width: 30rem;
  height: 40%;
  position: absolute;
  bottom: 3rem;
  right: 3rem;
  background: #000000;
  border-radius: 1rem;
  margin-top: 0 !important;

  @media (max-width: 480px) {
    width: 100%;
    height: 35rem;
    position: static;
    left: 0;
    top: 0;
    transform: translateY(0);
  }
`;

const ChatForm = styled("form")`
  @media (max-width: 480px) {
    width: 80%;
  }
`;

const ChatInput = styled(Input)`
  color: #ffffff;
  border: none;
`;

const ChatList = styled(Col)`
  overflow-y: auto;
  padding: 1rem;
`;

const UserMessage = styled(Text)`
  color: #fff;
  width: 100%;
  overflow-wrap: break-word;
  white-space: initial;
`;

const SystemMessage = styled(Text)`
  width: 100%;
  width: fit-content;
  color: orangered;
  overflow-wrap: break-word;
  white-space: initial;
`;

interface PlayerStylingProps {
  isCrossed: boolean;
  isClear: boolean;
}

const PlayerWrapper = styled(Col, {
  shouldForwardProp: (prop: string) =>
    !["isCrossed", "isHighlighted"].includes(prop),
})<PlayerStylingProps>`
  width: 20rem;
  height: 20rem;
  border-radius: 50%;
  position: relative;
  padding: 1rem;
  opacity: 0.25;

  ${({isClear}) =>
    isClear &&
    css`
      opacity: 1;
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
    `} // @media (max-width: 480px) {
  //   width: 15rem;
  //   height: 15rem;
  // }
`;

const PlayerText = styled(Text)`
  max-width: 100%;
  background-color: #000000;
  position: absolute;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
`;

const PlayerTimer = styled(Timer)`
  color: #000000;
  font-size: 1.6rem;
  background-color: #ffffff;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid #000000;
  bottom: 2rem;
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

  @media (max-width: 480px) {
    width: 10rem;
  }
`;

const DeckBox = styled(Col)`
  width: 20rem;
  height: 25rem;
  position: relative;

  /* @media (max-width: 480px) {
    width: 10rem;
    height: 15rem;
  } */
`;

const AlternativeDeck = styled(Deck)`
  position: absolute;
  top: 0;
  left: 0;
`;

const PileText = styled(Text)`
  font-size: 3.4rem;

  @media (max-width: 480px) {
    font-size: 2.4rem;
  }
`;

const PileBox = styled(Col)`
  width: 20rem;
  height: 25rem;
  background-color: #000000;
  border-radius: 1rem;
  text-align: center;

  /* @media (max-width: 480px) {
    width: 10rem;
    height: 15rem;
  } */
`;

const Profile = styled(Player)`
  position: absolute;
  bottom: 3rem;
  left: 3rem;

  @media (max-width: 480px) {
    position: relative;
    left: 0;
    bottom: 0;
  }
`;

const ModalWrapper = styled(Col)`
  max-width: 100%;
  width: max-content;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const ModalText = styled(Text)`
  font-size: 4.5rem;
  text-align: center;
  background: #000000;
  padding: 1rem;
`;

const DefuseText = styled(ModalText)`
  color: #8fbc5c;
  padding: 2rem;
`;

const SpotText = styled(ModalText)`
  color: #fff;
  padding: 2rem;
`;

interface DeckCardProps extends CardProps {
  stopped?: boolean;
}

const DeckCard: React.FC<DeckCardProps> = (props) => {
  const dispatch = useDispatch();

  const match = useSelector(matchModel.selectors.match)!;

  const [position, setPosition] = React.useState({x: 0, y: 0});

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPosition({x: data.x, y: data.y});
  };

  const handleDragStop: DraggableEventHandler = (_, data) => {
    const isOk = props.type === "nope" || !match.stopped;

    if (!isOk) {
      setPosition({x: 0, y: 0});

      return;
    }

    const card = data.node.getBoundingClientRect();
    const pile = document.getElementById("pile")!.getBoundingClientRect();

    const isInsideX =
      card.x >= pile.x && card.x + card.width <= pile.x + pile.width;

    const isInsideY =
      card.y >= pile.y && card.y + card.height <= pile.y + pile.height;

    if (isInsideX && isInsideY) {
      if (match.hasToDefuse && props.type === "defuse") {
        dispatch(matchModel.actions.playDefuse({matchId: match.id}));

        setPosition({x: 0, y: 0});

        return;
      }

      dispatch(
        matchModel.actions.playCard({matchId: match.id, card: props.type}),
      );

      if (stopId) clearTimeout(stopId);

      dispatch(matchModel.actions.updateMatch({stopped: true}));

      stopId = setTimeout(() => {
        dispatch(matchModel.actions.updateMatch({stopped: false}));
      }, 5000);
    }

    setPosition({x: 0, y: 0});
  };

  const opacity = props.type === "nope" ? 1 : props.stopped ? 0.25 : 1;

  return (
    <Draggable position={position} onDrag={handleDrag} onStop={handleDragStop}>
      <div>
        <Card opacity={opacity} {...props} />
      </div>
    </Draggable>
  );
};

const Template = styled(CenterTemplate)`
  align-items: initial !important;
`;
