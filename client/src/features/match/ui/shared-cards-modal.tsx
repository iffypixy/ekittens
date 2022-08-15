import * as React from "react";
import {useSelector} from "react-redux";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {styled} from "@mui/material";
import {Button, H1} from "@shared/ui/atoms";
import {matchModel} from "@entities/match";
import {Card} from "@entities/card";

interface SharedCardsModalProps {
  open: boolean;
  handleClose: () => void;
}

export const SharedCardsModal: React.FC<SharedCardsModalProps> = ({
  open,
  handleClose,
}) => {
  const future = useSelector(matchModel.selectors.future);

  const handleClick = () => {
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>shared cards from the neighbour</Title>

          <Layout.Row gap={-6}>
            {future.map((card, idx, {length}) => (
              <SharedCard
                key={idx}
                name={card}
                style={{zIndex: length - idx}}
              />
            ))}
          </Layout.Row>

          <Button color="primary" variant="contained" onClick={handleClick}>
            okay
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const Title = styled(H1)`
  color: #ffffff;
`;

const SharedCard = styled(Card)`
  width: 20rem;
  height: 26rem;
`;
