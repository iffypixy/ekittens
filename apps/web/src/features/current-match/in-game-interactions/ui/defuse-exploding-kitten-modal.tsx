import React from "react";
import {css, styled} from "@mui/material";
import Draggable, {
  ControlPosition,
  DraggableEventHandler,
} from "react-draggable";

import {Card, cards} from "@entities/card";
import {useDispatch} from "@app/store";
import {currentMatchModel} from "@features/current-match";

import {dom} from "@shared/lib/dom";
import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {H1, H2, H4} from "@shared/ui/atoms";
import {styling} from "@shared/lib/styling";

import explodingkittencard from "@shared/assets/cards/exploding-kitten.png";
import defusecard from "@shared/assets/cards/defuse.png";

import {MODAL} from "../lib/modals";
import {model} from "../model";

const DEFUSE_SUCCESS_MODAL_DURATION = 2500;
const EK_DEFUSE_DURATION = 10000;

const modal = MODAL.DEFUSE_EXPLODING_KITTEN;

export const DefuseExplodingKittenModal: React.FC = () => {
  const dispatch = useDispatch();

  const {open, close} = model.useModal(modal);

  const match = currentMatchModel.useMatch()!;

  const [target, setTarget] = React.useState<DOMRect | null>(null);
  const [isSuccessIndicatorOpen, setIsSuccessIndicatorOpen] =
    React.useState(false);

  React.useEffect(() => {
    setTarget(null);
    setIsSuccessIndicatorOpen(false);
  }, [open]);

  const boxRef = React.useCallback((node: HTMLDivElement) => {
    setTarget(node?.getBoundingClientRect());
  }, []);

  if (!open) return null;

  const time = EK_DEFUSE_DURATION - (Date.now() - match.state.at);

  const handleDrop = (cardId: string) => {
    dispatch(
      model.actions.defuseEK({
        matchId: match.id,
        cardId,
      }),
    )
      .unwrap()
      .then(() => {
        dispatch(
          currentMatchModel.actions.addDiscardPileCard({
            card: "defuse",
          }),
        );

        dispatch(
          currentMatchModel.actions.removeDeckCard({
            cardId,
          }),
        );

        setIsSuccessIndicatorOpen(true);

        setTimeout(() => {
          setIsSuccessIndicatorOpen(false);

          dispatch(
            model.actions.setModalData({
              modal,
              data: {
                open: false,
              },
            }),
          );
        }, DEFUSE_SUCCESS_MODAL_DURATION);

        close();
      });
  };

  return (
    <Modal open>
      <Center>
        {isSuccessIndicatorOpen ? (
          <DefuseSuccess />
        ) : (
          <Wrapper gap={5}>
            <Title>defuse the exploding kitten!</Title>

            <Layout.Row gap={2}>
              <IndicatorImage src={defusecard} alt="defuse card" />

              <IndicatorImage
                src={explodingkittencard}
                alt="exploding kitten card"
              />
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

                <DefuseTimer time={time} />
              </Layout.Col>
            </DragBox>

            <Layout.Row w="100%" justify="center" gap={-3}>
              {match.cards!.map((card, idx) =>
                card.name === "defuse" && target ? (
                  <Defuse
                    key={idx}
                    handleDrop={() => handleDrop(card.id)}
                    target={target}
                  />
                ) : (
                  <CommonCard key={idx} name={card.name} />
                ),
              )}
            </Layout.Row>
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
  color: ${({theme}) => theme.palette.common.white};
  font-size: 5rem;
`;

const IndicatorImage = styled("img")`
  max-width: 15rem;
  max-height: 15rem;
  object-fit: contain;
  animation: ${styling.mixins.pulse} 1.5s infinite;
`;

const DragBox = styled(Layout.Col)`
  width: 20rem;
  height: 24rem;
  text-align: center;
  border: 2rem solid ${cards.details["defuse"].tone};
  background-color: ${({theme}) => theme.palette.common.black};
  border-radius: 10px;
`;

const DragTitle = styled(H4)`
  color: ${({theme}) => theme.palette.common.white};
`;

interface DefuseTimerProps {
  time: number;
}

const DefuseTimer: React.FC<DefuseTimerProps> = ({time}) => {
  const [timer, setTimer] = React.useState(time);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer((timer) => {
        const result = timer - 100;

        return result < 0 ? 0 : result;
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return <Timer>{(timer / 1000).toFixed(1)}</Timer>;
};

const Timer = styled(H2)`
  color: ${cards.details["defuse"].tone};
`;

const CommonCard = styled(Card)`
  width: 15rem;
  height: 21rem;
  filter: grayscale(1);
  z-index: 0;
`;

interface DefuseProps {
  target: DOMRect;
  handleDrop: () => void;
}

const Defuse: React.FC<DefuseProps> = ({target, handleDrop}) => {
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const [pos, setPos] = React.useState<ControlPosition>({x: 0, y: 0});
  const [isHeld, setIsHeld] = React.useState(false);

  const handleStart = () => {
    setIsHeld(true);
  };

  const handleStop = () => {
    const rect = cardRef.current!.getBoundingClientRect();

    const isOverlap = dom.isOverlap(rect, target);

    if (isOverlap) {
      handleDrop();
    } else {
      setPos({x: 0, y: 0});

      setIsHeld(false);
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
      <CardWrapper ref={cardRef}>
        <DefuseCard name="defuse" pulsing={!isHeld} />
      </CardWrapper>
    </Draggable>
  );
};

interface DefuseCardStyledProps {
  pulsing: boolean;
}

const CardWrapper = styled("div")`
  z-index: 100;
`;

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
