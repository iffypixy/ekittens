import React from "react";
import {css, styled} from "@mui/material";

import {useDispatch} from "@app/store";
import {cardPlayModel} from "@features/current-match/card-play";
import {Card, UnknownCard} from "@entities/card";
import {viewerModel} from "@entities/viewer";
import {currentMatchModel} from "@features/current-match";

import {Layout} from "@shared/lib/layout";
import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Avatar, Button, H1, Text} from "@shared/ui/atoms";

import {MODAL} from "../lib/modals";
import {model} from "../model";

interface ModalPayload {
  cardId: string;
}

interface ActiveCard {
  playerId: string;
  id: string;
}

const modal = MODAL.MARK_CARD;

export const MarkCardModal: React.FC = () => {
  const dispatch = useDispatch();

  const {open, payload, close} = model.useModal<ModalPayload>(modal);

  const credentials = viewerModel.useCredentials();

  const match = currentMatchModel.useMatch()!;

  const [card, setCard] = React.useState<ActiveCard | null>(null);

  React.useEffect(() => {
    setCard(null);
  }, [open]);

  if (!open) return null;

  const players = match.players.filter(
    (player) => player.id !== credentials.id,
  );

  const handleClose = () => {
    if (!card) return;

    dispatch(
      cardPlayModel.actions.playCard({
        matchId: match.id,
        cardId: payload.cardId,
        payload: {
          cardId: card.id,
          playerId: card.playerId,
        },
      }),
    )
      .unwrap()
      .then(() => {
        dispatch(
          currentMatchModel.actions.addDiscardPileCard({
            card: "mark",
          }),
        );

        dispatch(
          currentMatchModel.actions.removeDeckCard({
            cardId: payload.cardId,
          }),
        );

        close();
      });
  };

  const handleCardClick = (active: ActiveCard) => {
    const isActive = card?.id === active.id;

    if (isActive) setCard(null);
    else setCard(active);
  };

  return (
    <Modal open>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>select a card to mark</Title>

          <Layout.Row gap={3}>
            {players.map((player) => (
              <Player
                key={player.id}
                gap={2}
                active={player.id === card?.playerId}
              >
                <Avatar src={player.avatar} size={10} />
                <Username>{player.username}</Username>

                <Layout.Row gap={0.5}>
                  {player.cards.map((id) =>
                    player.marked.some((card) => card.id === id) ? (
                      <div key={id}>
                        <KnownCard
                          mini
                          name={
                            player.marked.find((card) => card.id === id)!.name
                          }
                        />
                      </div>
                    ) : (
                      <div
                        key={id}
                        role="presentation"
                        onClick={() =>
                          handleCardClick({playerId: player.id, id})
                        }
                      >
                        <MarkCard active={card?.id === id} />
                      </div>
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

interface StyledProps {
  active: boolean;
}

const Player = styled(Layout.Col)<StyledProps>`
  align-items: center;
  justify-content: space-between;
  transition: 0.2s linear;
  filter: grayscale(1);
  padding: 3rem;

  ${({active}) =>
    active &&
    css`
      filter: grayscale(0);
    `};
`;

const Username = styled(Text)`
  color: ${({theme}) => theme.palette.common.white};
  font-size: 2rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
`;

const KnownCard = styled(Card)`
  width: 4rem;
  height: 5.25rem;
  box-shadow: none;
`;

const MarkCard = styled(UnknownCard)<StyledProps>`
  width: 4rem;
  height: 5.25rem;
  filter: grayscale(1);
  transition: 0.2s linear;
  cursor: pointer;
  box-shadow: none;
  border-radius: 5px;

  ${({active}) =>
    active &&
    css`
      filter: grayscale(0);
    `};

  svg {
    width: 1.75rem;
  }
`;
