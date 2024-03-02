import React from "react";
import {styled} from "@mui/material";

import {useDispatch} from "@app/store";
import {currentMatchModel} from "@features/current-match";

import {Center} from "@shared/ui/templates";
import {Button, H1} from "@shared/ui/atoms";
import {Modal} from "@shared/lib/modal";
import {Layout} from "@shared/lib/layout";
import {isNullish} from "@shared/lib/auxiliary";

import {model} from "../model";
import {MODAL} from "../lib/modals";

const modal = MODAL.INSERT_EXPLODING_KITTEN;

export const InsertExplodingKittenModal: React.FC = () => {
  const dispatch = useDispatch();

  const {open, close} = model.useModal(modal);

  const match = currentMatchModel.useMatch()!;

  const [spot, setSpot] = React.useState<number | null>(null);

  React.useEffect(() => {
    setSpot(null);
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    if (isNullish(spot)) return;

    dispatch(
      model.actions.insertEK({
        matchId: match.id,
        spotIndex: spot!,
      }),
    )
      .unwrap()
      .then(() => {
        close();
      });
  };

  const first = spot === 0;
  const last = spot === match.draw + 1 - 1;

  return (
    <Modal open>
      <Center>
        <Layout.Col align="center" gap={5}>
          <Title>insert an exploding kitten back</Title>

          <Select w={35} gap={1}>
            <SpotButton
              variant="contained"
              onClick={() => setSpot(0)}
              color={first ? "primary" : "info"}
            >
              on the top
            </SpotButton>

            {Array.from({length: match.draw + 1 - 2}).map((_, idx) => (
              <SpotButton
                key={idx}
                variant="contained"
                onClick={() => setSpot(idx + 1)}
                color={spot === idx + 1 ? "primary" : "info"}
              >
                spot {idx + 2}
              </SpotButton>
            ))}

            <SpotButton
              variant="contained"
              onClick={() => setSpot(match.draw + 1 - 1)}
              color={last ? "primary" : "info"}
            >
              on the bottom
            </SpotButton>
          </Select>

          <Button color="primary" variant="contained" onClick={handleClose}>
            hide kitten
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const Title = styled(H1)`
  color: ${({theme}) => theme.palette.common.white};
  max-width: 35rem;
  text-align: center;
`;

const SpotButton = styled(Button)`
  width: 100%;
`;

const Select = styled(Layout.Col)`
  max-height: 50vh;
  border: 1rem solid ${({theme}) => theme.palette.info.main};
  border-radius: 10px;
  overflow-y: auto;
  padding: 1rem;
`;
