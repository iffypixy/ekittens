import * as React from "react";
import {styled} from "@mui/material";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
} from "react-draggable";

import {useDispatch} from "@app/store";
import {Card, CardName} from "@entities/card";
import {viewerModel} from "@entities/viewer";
import {currentMatchModel} from "@features/current-match";
import {
  inGameInteractionsModel,
  MODAL,
} from "@features/current-match/in-game-interactions";

import {Layout} from "@shared/lib/layout";
import {CardUnit} from "@shared/api/common";
import {dom} from "@shared/lib/dom";

import {model} from "../model";

const UNPLAYABLE_CARDS: CardName[] = ["defuse", "nope", "streaking-kitten"];

export const Deck: React.FC = () => {
  const credentials = viewerModel.useCredentials();

  const match = currentMatchModel.useMatch()!;

  const isTurn = match.players[match.turn]?.id === credentials.id;

  return (
    <Wrapper id="deck" gap={-3}>
      {match.cards?.map((card) =>
        isTurn ? (
          !UNPLAYABLE_CARDS.includes(card.name) ? (
            <PlayableCard key={card.id} {...card} />
          ) : (
            <UnplayableCard key={card.id} name={card.name} />
          )
        ) : (
          <UnplayableCard key={card.id} name={card.name} />
        ),
      )}
    </Wrapper>
  );
};

const UnplayableCard = styled(Card)`
  min-width: 16rem;
  min-height: 21rem;
  max-width: 16rem;
  max-height: 21rem;
  filter: grayscale(1);
  cursor: default;
  margin: 0;
`;

interface PlayableCardProps extends CardUnit {}

const PlayableCard: React.FC<PlayableCardProps> = ({name, id}) => {
  const dispatch = useDispatch();

  const match = currentMatchModel.useMatch()!;

  const [pos, setPos] = React.useState<ControlPosition>({x: 0, y: 0});

  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const handleStart = () => {
    const rect = cardRef.current!.getBoundingClientRect();

    cardRef.current!.style.position = "fixed";

    cardRef.current!.style.left = `${rect.left}px`;
  };

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPos({x: data.x, y: data.y});
  };

  const handleStop = () => {
    cardRef.current!.style.position = "initial";

    const pile = document.getElementById("discard-pile")!;

    const target = pile.getBoundingClientRect();
    const rect = cardRef.current!.getBoundingClientRect();

    const isOverlap = dom.isOverlap(target, rect);

    if (isOverlap) {
      if (name === "targeted-attack") {
        dispatch(
          inGameInteractionsModel.actions.setModalData({
            modal: MODAL.SELECT_PLAYER,
            data: {
              open: true,
              payload: {
                card: {id, name},
              },
            },
          }),
        );
      } else if (name === "mark") {
        dispatch(
          inGameInteractionsModel.actions.setModalData({
            modal: MODAL.MARK_CARD,
            data: {
              open: true,
              payload: {
                cardId: id,
              },
            },
          }),
        );
      }

      dispatch(
        model.actions.playCard({
          matchId: match.id,
          cardId: id,
        }),
      )
        .unwrap()
        .then(() => {
          dispatch(
            currentMatchModel.actions.addDiscardPileCard({
              card: name,
            }),
          );

          dispatch(
            currentMatchModel.actions.removeDeckCard({
              cardId: id,
            }),
          );
        });
    }

    setPos({x: 0, y: 0});
  };

  return (
    <Draggable
      position={pos}
      onStart={handleStart}
      onDrag={handleDrag}
      onStop={handleStop}
    >
      <CardWrapper ref={cardRef}>
        <ResponsiveCard name={name} />
      </CardWrapper>
    </Draggable>
  );
};

const Wrapper = styled(Layout.Row)`
  width: 100%;
  min-height: 27rem;
  border-top: 2px dotted ${({theme}) => theme.palette.divider};
  flex-wrap: nowrap;
  overflow-x: auto;
  padding: 3rem;

  & > :first-child {
    margin-left: auto;
  }

  & > :last-child {
    margin-right: auto;
  }
`;

const CardWrapper = styled("div")`
  &:hover {
    z-index: 100;
  }
`;

const ResponsiveCard = styled(Card)`
  min-width: 16rem;
  min-height: 21rem;
  max-width: 16rem;
  max-height: 21rem;
  transition: 0.1s linear;
  margin: 0;

  &:hover {
    transform: translate(0, -2rem);
  }
`;
