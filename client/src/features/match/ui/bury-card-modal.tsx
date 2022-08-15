import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Button, H1} from "@shared/ui/atoms";
import {Card} from "@entities/card";
import {matchModel} from "@entities/match";
import {useDispatch} from "@app/store";

interface BuryCardModalProps {
  open: boolean;
  handleClose: () => void;
}

export const BuryCardModal: React.FC<BuryCardModalProps> = ({
  open,
  handleClose,
}) => {
  const dispatch = useDispatch();

  const match = useSelector(matchModel.selectors.match)!;

  const [active, setActive] = React.useState<number | null>(null);

  const handleClick = () => {
    if (active === null) return;

    dispatch(
      matchModel.actions.buryCard({matchId: match.id, spotIndex: active}),
    );

    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>bury the card</Title>

          <Layout.Row gap={3} align="center">
            <BuryCard name={match.state.payload?.card} />

            <Select w={35} gap={1}>
              <SpotButton
                variant="contained"
                fullWidth
                onClick={() => setActive(0)}
                color={active === 0 ? "primary" : "info"}
              >
                on the top
              </SpotButton>

              {Array.from({length: match.draw - 2}).map((_, idx) => (
                <SpotButton
                  key={idx}
                  variant="contained"
                  onClick={() => setActive(idx + 1)}
                  color={active === idx + 1 ? "primary" : "info"}
                >
                  spot {idx + 2}
                </SpotButton>
              ))}

              <SpotButton
                variant="contained"
                fullWidth
                onClick={() => setActive(match.draw - 1)}
                color={active === match.draw - 1 ? "primary" : "info"}
              >
                on the bottom
              </SpotButton>
            </Select>
          </Layout.Row>

          <Button color="primary" variant="contained" onClick={handleClick}>
            bury
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const Title = styled(H1)`
  color: #ffffff;
`;

const BuryCard = styled(Card)`
  width: 23rem;
  height: 30rem;
`;

const SpotButton = styled(Button)`
  width: 100%;
`;

const Select = styled(Layout.Col)`
  border: 1rem solid ${({theme}) => theme.palette.info.main};
  border-radius: 1rem;
  padding: 1rem;
`;
