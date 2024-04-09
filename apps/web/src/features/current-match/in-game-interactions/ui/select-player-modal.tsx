import React from "react";
import {css, styled} from "@mui/material";

import {useDispatch} from "@app/store";
import {Card, CardUnit, UnknownCard} from "@entities/card";
import {viewerModel} from "@entities/viewer";
import {currentMatchModel} from "@features/current-match";
import {cardPlayModel} from "@features/current-match/card-play";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, Text} from "@shared/ui/atoms";

import {model} from "../model";
import {MODAL} from "../lib/modals";

interface ModalPayload {
  card: CardUnit;
  handlePick: (playerId: string) => Promise<void>;
}

const modal = MODAL.SELECT_PLAYER;

export const SelectPlayerModal: React.FC = () => {
  const dispatch = useDispatch();

  const {open, payload, close} = model.useModal<ModalPayload>(modal);

  const credentials = viewerModel.useCredentials();

  const match = currentMatchModel.useMatch()!;

  const [playerId, setPlayerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPlayerId(null);
  }, [open]);

  if (!open) return null;

  const players = match.players.filter(
    (player) => player.id !== credentials.id,
  );

  const handlePlayerClick = (pId: string) => {
    if (playerId !== pId) setPlayerId(pId);
    else setPlayerId(null);
  };

  const handleClose = () => {
    if (!playerId) return;

    dispatch(
      cardPlayModel.actions.playCard({
        cardId: payload.card.id,
        matchId: match.id,
        payload: {
          playerId,
        },
      }),
    )
      .unwrap()
      .then(() => {
        dispatch(
          currentMatchModel.actions.addDiscardPileCard({
            card: payload.card.name,
          }),
        );

        dispatch(
          currentMatchModel.actions.removeDeckCard({
            cardId: payload.card.id,
          }),
        );

        close();
      });
  };

  return (
    <Modal open>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>select a player</Title>

          <Layout.Row gap={3}>
            {players.map((player) => (
              <Player
                key={player.id}
                active={playerId === player.id}
                onClick={() => handlePlayerClick(player.id)}
                gap={2}
              >
                <Avatar src={player.avatar} size={20} />
                <Username>{player.username}</Username>

                <Layout.Row gap={-1}>
                  {player.cards.map((id, idx) =>
                    player.marked.some((card) => card.id === id) ? (
                      <Card
                        key={idx}
                        name={
                          player.marked.find((card) => card.id === id)!.name
                        }
                        mini
                      />
                    ) : (
                      <UnknownCard key={idx} mini />
                    ),
                  )}
                </Layout.Row>
              </Player>
            ))}
          </Layout.Row>

          <Button onClick={handleClose} color="primary" variant="contained">
            select
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const Title = styled(H1)`
  color: ${({theme}) => theme.palette.common.white};
`;

interface PlayerStyledProps {
  active: boolean;
}

const Player = styled(Layout.Col)<PlayerStyledProps>`
  align-items: center;
  justify-content: space-between;
  background-color: ${({theme}) => theme.palette.primary.main};
  border-radius: 10px;
  box-shadow: 0 0 10px 1px ${({theme}) => theme.palette.primary.main};
  transition: 0.2s linear;
  filter: grayscale(1);
  cursor: pointer;
  padding: 3rem;

  ${({active}) =>
    active &&
    css`
      filter: grayscale(0);
    `}
`;

const Username = styled(Text)`
  color: ${({theme}) => theme.palette.common.white};
  font-size: 3rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
`;
