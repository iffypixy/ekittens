import * as React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";

import {matchModel} from "@entities/match";
import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Button, H1} from "@shared/ui/atoms";
import {Card} from "@entities/card";

interface SeeTheFutureModalProps {
  open: boolean;
  handleClose: () => void;
}

export const SeeTheFutureModal: React.FC<SeeTheFutureModalProps> = ({
  open,
  handleClose,
}) => {
  const future = useSelector(matchModel.selectors.future) || [];

  const handleClick = () => {
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>future cards</Title>

          <Layout.Row gap={-6}>
            {future.map((card, idx, {length}) => (
              <FutureCard
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

const FutureCard = styled(Card)`
  width: 20rem;
  height: 26rem;
`;

const Title = styled(H1)`
  color: #ffffff;
`;
