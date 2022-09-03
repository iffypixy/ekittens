import * as React from "react";
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

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPos({x: data.x, y: data.y});
  };

  const handleStop = () => {
    const rect = pileRef.current!.getBoundingClientRect();
    const target = document.getElementById("deck")!.getBoundingClientRect();

    const isOverlap = dom.isOverlap(rect, target!);

    if (isOverlap) {
      dispatch(
        model.actions.drawCard({
          matchId: match.id,
        }),
      );
    }

    setPos({x: 0, y: 0});
  };

  return (
    <Wrapper>
      <Pile>
        <AlternativeCard />

        {isTurn && (
          <Draggable onDrag={handleDrag} onStop={handleStop} position={pos}>
            <div ref={pileRef}>
              <UnknownCard />
            </div>
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

const AlternativeCard = styled(UnknownCard)`
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
