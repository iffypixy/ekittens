import * as React from "react";
import {css, styled} from "@mui/material";
import {useSelector} from "react-redux";

import {Layout} from "@shared/lib/layout";
import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Avatar, Button, H1, Text} from "@shared/ui/atoms";
import {Card, UnknownCard} from "@entities/card";
import {matchModel} from "@entities/match";
import {authModel} from "@features/auth";

interface MarkCardModalProps {
  open: boolean;
  handleClose: () => void;
  action: (active: ActiveCard) => void;
}

interface ActiveCard {
  playerId: string;
  cardId: string;
}

export const MarkCardModal: React.FC<MarkCardModalProps> = ({
  open,
  handleClose,
  action,
}) => {
  const credentials = useSelector(authModel.selectors.credentials)!;

  const match = useSelector(matchModel.selectors.match)!;

  const [active, setActive] = React.useState<ActiveCard | null>(null);

  const players = match.players.filter(
    (player) => player.id !== credentials.id,
  );

  const handleClick = () => {
    if (!active) return;

    action(active);

    handleClose();
  };

  const handleCardClick = (card: ActiveCard) => {
    const isActive = active?.cardId === card.cardId;

    if (isActive) setActive(null);
    else setActive(card);
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>select a card to mark</Title>

          <Layout.Row gap={3}>
            {players.map((player) => (
              <Player
                key={player.id}
                gap={2}
                active={player.id === active?.playerId}
              >
                <PlayerAvatar src={player.avatar} />
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
                        onClick={() =>
                          handleCardClick({playerId: player.id, cardId: id})
                        }
                      >
                        <MarkCard active={active?.cardId === id} />
                      </div>
                    ),
                  )}
                </Layout.Row>
              </Player>
            ))}
          </Layout.Row>

          <Button onClick={handleClick} color="primary" variant="contained">
            select
          </Button>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const Title = styled(H1)`
  color: #ffffff;
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

const PlayerAvatar = styled(Avatar)`
  width: 10rem;
  height: 10rem;
`;

const Username = styled(Text)`
  color: #ffffff;
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
  border-radius: 0.5rem;

  ${({active}) =>
    active &&
    css`
      filter: grayscale(0);
    `};

  svg {
    width: 1.75rem;
  }
`;
