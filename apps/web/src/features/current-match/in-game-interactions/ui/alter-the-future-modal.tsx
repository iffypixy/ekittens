import React from "react";
import {styled} from "@mui/material";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DragDropContextProps,
} from "react-beautiful-dnd";

import {currentMatchModel} from "@features/current-match";
import {Card, CardName} from "@entities/card";
import {useDispatch} from "@app/store";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Button, H1, Text} from "@shared/ui/atoms";

import {model} from "../model";
import {MODAL} from "../lib/modals";

interface ModalPayload {
  cards: CardName[];
}

const modal = MODAL.ALTER_THE_FUTURE;

export const AlterTheFutureModal: React.FC = () => {
  const dispatch = useDispatch();

  const {open, payload, close} = model.useModal<ModalPayload>(modal);

  const match = currentMatchModel.useMatch()!;

  const [isDragging, setIsDragging] = React.useState(false);

  if (!open) return null;

  const handleDragStart: DragDropContextProps["onDragStart"] = () => {
    setIsDragging(true);
  };

  const handleDragEnd: DragDropContextProps["onDragEnd"] = (result) => {
    setIsDragging(false);

    if (!result.destination) return;

    const updated = [...payload.cards];

    const [removed] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, removed);

    dispatch(
      model.actions.setModalData({
        modal,
        data: {
          payload: {
            cards: updated,
          },
        },
      }),
    );
  };

  const handleClose = () => {
    dispatch(
      model.actions.alterTheFuture({
        matchId: match.id,
        order: payload.cards,
      }),
    )
      .unwrap()
      .then(() => {
        close();
      });
  };

  return (
    <Modal open>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>alter the future</Title>

          <DragDropContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <AlterBox gap={1} highlighted={isDragging}>
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
                    {payload.cards.map((card, idx) => (
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
            </AlterBox>
          </DragDropContext>

          <Button color="primary" variant="contained" onClick={handleClose}>
            alter cards
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const AlterBox = styled(Layout.Col)<{highlighted: boolean}>`
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  transition: 0.1s linear;
  padding: 1.5rem;
  background-color: ${({highlighted}) =>
    highlighted ? "rgba(244, 177, 77, 0.5)" : "initial"};
`;

const FutureCard = styled(Card)`
  width: 14rem;
  height: 20rem;
  margin: 0;
`;

const Title = styled(H1)`
  color: ${({theme}) => theme.palette.common.white};
`;

const Spot = styled(Text)`
  color: ${({theme}) => theme.palette.common.white};
  font-size: 1.4rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
`;
