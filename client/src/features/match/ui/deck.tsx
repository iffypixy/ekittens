import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
} from "react-draggable";

import {matchModel} from "@entities/match";
import {Layout} from "@shared/lib/layout";
import {Card} from "@entities/card";
import {useDispatch} from "@app/store";
import {authModel} from "@features/auth";
import {CardUnit} from "@shared/api/common";
import {SelectPlayerModal} from "./select-player-modal";
import {MarkCardModal} from "./mark-card-modal";

export const Deck: React.FC = () => {
  const credentials = useSelector(authModel.selectors.credentials)!;

  const match = useSelector(matchModel.selectors.match)!;

  const isTurn = match.players[match.turn]?.id === credentials.id;

  const isWFA = match.state.type === "waiting-for-action";
  const isAD = match.state.type === "action-delay";

  return (
    <Wrapper id="deck" gap={-3}>
      {match.cards!.map((card, idx) =>
        isTurn && isWFA ? (
          !["defuse", "nope", "streaking-kitten"].includes(card.name) ? (
            <PlayableCard key={idx} {...card} />
          ) : (
            <DeckCard key={idx} name={card.name} />
          )
        ) : !isTurn && isWFA ? (
          <DeckCard key={idx} name={card.name} />
        ) : isAD && ((isTurn && match.context.noped) || !isTurn) ? (
          ["nope"].includes(card.name) ? (
            <PlayableCard key={idx} {...card} />
          ) : (
            <DeckCard key={idx} name={card.name} />
          )
        ) : (
          <DeckCard key={idx} name={card.name} />
        ),
      )}
    </Wrapper>
  );
};

const DeckCard = styled(Card)`
  filter: grayscale(1);
  cursor: default;
`;

interface PlayableCardProps extends CardUnit {}

const PlayableCard: React.FC<PlayableCardProps> = ({name, id}) => {
  const dispatch = useDispatch();

  const match = useSelector(matchModel.selectors.match)!;

  const [pos, setPos] = React.useState<ControlPosition>({x: 0, y: 0});

  const [isSPModalOpen, setIsSPModalOpen] = React.useState(false);
  const [isMCModalOpen, setIsMCModalOpen] = React.useState(false);

  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPos({x: data.x, y: data.y});
  };

  const handleStop = () => {
    const pile = document.getElementById("discard-pile")!;

    const target = pile.getBoundingClientRect();
    const rect = cardRef.current!.getBoundingClientRect();

    const isOverlap = !(
      rect.right < target.left ||
      rect.left > target.right ||
      rect.bottom < target.top ||
      rect.top > target.bottom
    );

    if (isOverlap) {
      const isTargetedAttack = name === "targeted-attack";
      const isMark = name === "mark";
      const isNope = name === "nope";

      if (isTargetedAttack) {
        setIsSPModalOpen(true);
      } else if (isMark) {
        setIsMCModalOpen(true);
      } else if (isNope) {
        dispatch(matchModel.actions.nopeCard({matchId: match.id, cardId: id}));

        dispatch(matchModel.actions.addDiscardCard(name));
        dispatch(matchModel.actions.removeCard({id}));
      } else {
        dispatch(matchModel.actions.playCard({matchId: match.id, cardId: id}));

        dispatch(matchModel.actions.addDiscardCard(name));
        dispatch(matchModel.actions.removeCard({id}));
      }
    }

    setPos({x: 0, y: 0});
  };

  return (
    <>
      <SelectPlayerModal
        open={isSPModalOpen}
        handleClose={() => setIsSPModalOpen(false)}
        action={(player) => {
          dispatch(
            matchModel.actions.playCard({
              matchId: match.id,
              cardId: id,
              payload: {playerId: player.id},
            }),
          );

          dispatch(matchModel.actions.addDiscardCard(name));
          dispatch(matchModel.actions.removeCard({id}));
        }}
      />

      <MarkCardModal
        open={isMCModalOpen}
        handleClose={() => setIsMCModalOpen(false)}
        action={(payload) => {
          dispatch(
            matchModel.actions.playCard({
              matchId: match.id,
              cardId: id,
              payload,
            }),
          );

          dispatch(matchModel.actions.addDiscardCard(name));
          dispatch(matchModel.actions.removeCard({id}));
        }}
      />

      <Draggable position={pos} onDrag={handleDrag} onStop={handleStop}>
        <CardWrapper ref={cardRef}>
          <ResponsiveCard name={name} />
        </CardWrapper>
      </Draggable>
    </>
  );
};

const Wrapper = styled(Layout.Row)`
  width: 100%;
  justify-content: center;
  border-top: 2px dotted ${({theme}) => theme.palette.divider};
  padding: 3rem;
`;

const CardWrapper = styled("div")`
  &:hover {
    z-index: 100;
  }
`;

const ResponsiveCard = styled(Card)`
  transition: 0.1s linear;

  &:hover {
    transform: translate(0, -2rem);
  }
`;
