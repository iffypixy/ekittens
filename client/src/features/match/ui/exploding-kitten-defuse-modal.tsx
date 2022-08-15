import * as React from "react";
import {useSelector} from "react-redux";
import {css, styled} from "@mui/material";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
} from "react-draggable";

import {matchModel} from "@entities/match";
import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {H1, H2, H4} from "@shared/ui/atoms";
import {styling} from "@shared/lib/styling";
import {Card} from "@entities/card";
import {useDispatch} from "@app/store";
import explodingkittencard from "@shared/assets/cards/exploding-kitten.png";
import defusecard from "@shared/assets/cards/defuse.png";

const DEFUSE_SUCCESS_MODAL_DURATION = 2500;
const EK_DEFUSE_DURATION = 10000;

interface ExplodingKittenDefuseModalProps {
  open: boolean;
  handleClose: () => void;
}

export const ExplodingKittenDefuseModal: React.FC<
  ExplodingKittenDefuseModalProps
> = ({open, handleClose}) => {
  const match = useSelector(matchModel.selectors.match)!;

  const [target, setTarget] = React.useState<DOMRect | null>(null);
  const [showSuccess, setShowSuccess] = React.useState<boolean>(false);

  const [timer, setTimer] = React.useState(
    EK_DEFUSE_DURATION - (Date.now() - match.state.at),
  );

  React.useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const timer = EK_DEFUSE_DURATION - (Date.now() - match.state.at);

      if (timer < 0) setTimer(0);
      else setTimer(timer);
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [open]);

  const boxRef = React.useCallback((node: HTMLDivElement) => {
    setTarget(node?.getBoundingClientRect());
  }, []);

  const onDrop = () => {
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      handleClose();
    }, DEFUSE_SUCCESS_MODAL_DURATION);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        {showSuccess ? (
          <DefuseSuccess />
        ) : (
          <Wrapper gap={5}>
            <Title>defuse the exploding kitten!</Title>

            <Layout.Row gap={2}>
              <IndicatorImage
                src={explodingkittencard}
                alt="exploding kitten card"
              />
              <IndicatorImage src={defusecard} alt="defuse card" />
            </Layout.Row>

            <DragBox ref={boxRef}>
              <Layout.Col
                w="100%"
                h="100%"
                justify="center"
                align="center"
                p={2}
              >
                <DragTitle>drag defuse here</DragTitle>
                <Timer>{(timer / 1000).toFixed(1)}</Timer>
              </Layout.Col>
            </DragBox>

            <Cards gap={-3}>
              {match.cards!.map((card) =>
                card.name === "defuse" && target ? (
                  <Defuse onDrop={onDrop} target={target} id={card.id} />
                ) : (
                  <CommonCard name={card.name} />
                ),
              )}
            </Cards>
          </Wrapper>
        )}
      </Center>
    </Modal>
  );
};

const Wrapper = styled(Layout.Col)`
  text-align: center;
  align-items: center;
`;

const Title = styled(H1)`
  color: #ffffff;
  font-size: 5rem;
`;

const IndicatorImage = styled("img")`
  max-width: 15rem;
  max-height: 15rem;
  object-fit: contain;
  animation: ${styling.mixins.pulse} 1.5s infinite;
`;

const DragBox = styled(Layout.Col)`
  width: 21rem;
  height: 26rem;
  text-align: center;
  border: 2rem solid #a1ce39;
  background-color: #000000;
  border-radius: 1rem;
`;

const DragTitle = styled(H4)`
  color: #ffffff;
`;

const Timer = styled(H2)`
  color: #a1ce39;
`;

const Cards = styled(Layout.Row)`
  width: 100%;
  justify-content: center;
`;

const CommonCard = styled(Card)`
  filter: grayscale(1);
  z-index: 0;
  cursor: pointer;
`;

interface DefuseProps {
  target: DOMRect;
  onDrop: () => void;
  id: string;
}

const Defuse: React.FC<DefuseProps> = ({target, onDrop, id}) => {
  const dispatch = useDispatch();

  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = React.useState<ControlPosition>({x: 0, y: 0});
  const [isHold, setIsHold] = React.useState<boolean>(false);

  const match = useSelector(matchModel.selectors.match)!;

  const handleStart = () => {
    setIsHold(true);
  };

  const handleStop = () => {
    const rect = cardRef.current!.getBoundingClientRect();

    const isOverlap = !(
      rect.right < target.left ||
      rect.left > target.right ||
      rect.bottom < target.top ||
      rect.top > target.bottom
    );

    if (isOverlap) {
      dispatch(matchModel.actions.defuse({matchId: match.id, cardId: id}));

      dispatch(matchModel.actions.removeCard({id}));

      onDrop();
    } else {
      setPos({x: 0, y: 0});
      setIsHold(false);
    }
  };

  const handleDrag: DraggableEventHandler = (_, pos) => {
    setPos(pos);
  };

  return (
    <Draggable
      position={pos}
      onStart={handleStart}
      onStop={handleStop}
      onDrag={handleDrag}
    >
      <div ref={cardRef}>
        <DefuseCard name="defuse" pulsing={!isHold} />
      </div>
    </Draggable>
  );
};

interface DefuseCardStyledProps {
  pulsing: boolean;
}

const DefuseCard = styled(Card)<DefuseCardStyledProps>`
  z-index: 1;
  cursor: pointer;

  ${({pulsing}) =>
    pulsing &&
    css`
      animation: ${styling.mixins.pulse} 1.5s infinite;
    `}
`;

const DefuseSuccess: React.FC = () => (
  <SuccessWrapper gap={12}>
    <Title>
      kitten <SuccessText>defused</SuccessText>
    </Title>

    <SuccessBox>
      <SuccessDefuse name="defuse" />
    </SuccessBox>
  </SuccessWrapper>
);

const SuccessWrapper = styled(Layout.Col)`
  text-align: center;
  align-items: center;
`;

const SuccessText = styled("p")`
  color: #a1ce39;
`;

const SuccessDefuse = styled(Card)`
  width: 100%;
  height: 100%;
  border-radius: 0;
  margin: 0;
`;

const SuccessBox = styled(DragBox)`
  width: 26rem;
  height: 32rem;
  text-align: center;
  border: 1rem solid #a1ce39;
  background-color: #000000;
  border-radius: 1rem;
`;
