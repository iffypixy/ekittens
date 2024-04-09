import React from "react";
import {styled} from "@mui/material";

import {Card, CardName} from "@entities/card";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Button, H1} from "@shared/ui/atoms";

import {model} from "../model";
import {MODAL} from "../lib/modals";

interface ModalPayload {
  cards: CardName[];
}

const modal = MODAL.SEE_THE_FUTURE;

export const SeeTheFutureModal: React.FC = () => {
  const {open, payload, close} = model.useModal<ModalPayload>(modal);

  if (!open) return null;

  return (
    <Modal open>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>future cards</Title>

          <Layout.Row gap={-4}>
            {payload.cards.map((card, idx, {length}) => (
              <FutureCard
                key={idx}
                name={card}
                style={{zIndex: length - idx}}
              />
            ))}
          </Layout.Row>

          <Button color="primary" variant="contained" onClick={close}>
            okay
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const FutureCard = styled(Card)`
  width: 14rem;
  height: 20rem;
`;

const Title = styled(H1)`
  color: ${({theme}) => theme.palette.common.white};
`;
