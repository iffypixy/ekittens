import * as React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DragDropContextProps,
} from "react-beautiful-dnd";

import {matchModel} from "@entities/match";
import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Button, H1, Text} from "@shared/ui/atoms";
import {Card, CardName} from "@entities/card";
import {useDispatch} from "@app/store";

interface ShareTheFutureModalProps {
  open: boolean;
  handleClose: () => void;
}

export const ShareTheFutureModal: React.FC<ShareTheFutureModalProps> = ({
  open,
  handleClose,
}) => {
  const dispatch = useDispatch();

  const match = useSelector(matchModel.selectors.match)!;

  const future = match.state.payload?.cards || [];

  const [cards, setCards] = React.useState<CardName[]>(future);

  React.useEffect(() => {
    setCards(future);
  }, [future]);

  const handleDragEnd: DragDropContextProps["onDragEnd"] = (result) => {
    if (!result.destination) return;

    const duplicate = [...cards];

    const [removed] = duplicate.splice(result.source.index, 1);
    duplicate.splice(result.destination.index, 0, removed);

    setCards(duplicate);
  };

  const handleClick = () => {
    dispatch(
      matchModel.actions.shareFutureCards({matchId: match.id, order: cards}),
    );

    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>share the future</Title>

          <DragDropContext onDragEnd={handleDragEnd}>
            <ShareBox gap={1}>
              <Layout.Row w="100%" justify="flex-start">
                <Spot>top card</Spot>
              </Layout.Row>

              <Droppable droppableId="atf-cards" direction="horizontal">
                {(provided) => (
                  <Layout.Row
                    ref={provided.innerRef}
                    gap={1.5}
                    {...provided.droppableProps}
                  >
                    {cards.map((card, idx) => (
                      <Draggable
                        key={idx}
                        draggableId={String(idx)}
                        index={idx}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <FutureCard name={card} />
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </Layout.Row>
                )}
              </Droppable>

              <Layout.Row w="100%" justify="flex-end">
                <Spot>bottom card</Spot>
              </Layout.Row>
            </ShareBox>
          </DragDropContext>

          <Button color="primary" variant="contained" onClick={handleClick}>
            share cards
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const ShareBox = styled(Layout.Col)`
  align-items: center;
  justify-content: center;
`;

const FutureCard = styled(Card)`
  width: 20rem;
  height: 26rem;
  margin: 0;
`;

const Title = styled(H1)`
  color: #ffffff;
`;

const Spot = styled(Text)`
  color: #ffffff;
  font-size: 1.4rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
`;
