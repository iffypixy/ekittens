import React from "react";
import {styled} from "@mui/material";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
} from "react-draggable";
import {Trans} from "react-i18next";

import {useDispatch} from "@app/store";
import {UnknownCard} from "@entities/card";
import {viewerModel} from "@entities/viewer";
import {currentMatchModel} from "@features/current-match";

import {dom} from "@shared/lib/dom";
import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

import {model} from "../model";

export const DrawPile: React.FC = () => {
  const dispatch = useDispatch();

  const credentials = viewerModel.useCredentials();

  const match = currentMatchModel.useMatch()!;

  const [pos, setPos] = React.useState<ControlPosition>({x: 0, y: 0});

  const pileRef = React.useRef<HTMLDivElement | null>(null);

  const isTurn = match.players[match.turn]?.id === credentials.id;

  const isIKNext =
    typeof match.context.ikspot === "number" && match.context.ikspot === 0;

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPos({x: data.x, y: data.y});

    const deck = document.getElementById("deck")!;
    const rect = pileRef.current!.getBoundingClientRect();

    const target = deck.getBoundingClientRect()!;

    const isOverlap = dom.isOverlap(rect, target);

    deck.style.backgroundColor = isOverlap
      ? "rgba(0, 168, 0, 0.5)"
      : "rgba(244, 177, 77, 0.5)";
  };

  const handleStart = () => {
    const deck = document.getElementById("deck")!;

    deck.style.backgroundColor = "rgba(244, 177, 77, 0.5)";
  };

  const handleStop = () => {
    setPos({x: 0, y: 0});

    const deck = document.getElementById("deck")!;
    const rect = pileRef.current!.getBoundingClientRect();

    const target = deck.getBoundingClientRect();

    const isOverlap = dom.isOverlap(rect, target!);

    if (isOverlap) {
      dispatch(
        model.actions.drawCard({
          matchId: match.id,
        }),
      );
    }

    deck.style.backgroundColor = "initial";
  };

  return (
    <Wrapper>
      <Pile>
        <AlternativeCard active={isTurn} asIK={isIKNext} />

        {isTurn && (
          <Draggable
            onDrag={handleDrag}
            onStart={handleStart}
            onStop={handleStop}
            position={pos}
          >
            <UnknownWrapper ref={pileRef}>
              <UnknownCard asIK={isIKNext} />
            </UnknownWrapper>
          </Draggable>
        )}
      </Pile>

      <LeftCards>
        <Trans
          i18nKey="remaining-cards"
          ns="match"
          values={{number: match.draw}}
        />
      </LeftCards>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  text-align: center;
`;

const Pile = styled(Layout.Col)`
  position: relative;
  width: 16rem;
  height: 21rem;
`;

const UnknownWrapper = styled("div")`
  z-index: 1000;
`;

const AlternativeCard = styled(UnknownCard)<{active: boolean}>`
  filter: ${({active}) => !active && "grayscale(1)"};
  position: absolute;
  top: 0;
  left: 0;
`;

const LeftCards = styled(Text)`
  font-size: 1.4rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
  margin-top: 1.5rem;
`;
