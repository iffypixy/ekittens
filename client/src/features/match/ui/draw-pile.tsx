import * as React from "react";
import {styled} from "@mui/material";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
} from "react-draggable";
import {useSelector} from "react-redux";
import {Trans} from "react-i18next";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {UnknownCard} from "@entities/card";
import {matchModel} from "@entities/match";
import {authModel} from "@features/auth";
import {useDispatch} from "@app/store";

export const DrawPile: React.FC = () => {
  const dispatch = useDispatch();

  const credentials = useSelector(authModel.selectors.credentials)!;

  const match = useSelector(matchModel.selectors.match)!;

  const [pos, setPos] = React.useState<ControlPosition>({x: 0, y: 0});

  const pileRef = React.useRef<HTMLDivElement | null>(null);

  const isTurn = match.players[match.turn]?.id === credentials.id;

  const handleDrag: DraggableEventHandler = (_, data) => {
    setPos({x: data.x, y: data.y});
  };

  const handleStop = () => {
    const deck = document.getElementById("deck")!;

    const target = deck.getBoundingClientRect();
    const rect = pileRef.current!.getBoundingClientRect();

    const isOverlap = !(
      rect.right < target.left ||
      rect.left > target.right ||
      rect.bottom < target.top ||
      rect.top > target.bottom
    );

    if (isOverlap) {
      dispatch(matchModel.actions.drawCard({matchId: match.id}));
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
