import * as React from "react";
import {css, styled} from "@mui/material";
import {useSelector} from "react-redux";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, Text} from "@shared/ui/atoms";
import {authModel} from "@features/auth";
import {matchModel} from "@entities/match";
import {Card, UnknownCard} from "@entities/card";
import {OngoingMatchPlayer} from "@shared/api/common";

interface SelectPlayerModalProps {
  open: boolean;
  handleClose: () => void;
  action: (player: OngoingMatchPlayer) => void;
}

export const SelectPlayerModal: React.FC<SelectPlayerModalProps> = ({
  open,
  handleClose,
  action,
}) => {
  const credentials = useSelector(authModel.selectors.credentials)!;

  const match = useSelector(matchModel.selectors.match)!;

  const [active, setActive] = React.useState<string | null>(null);

  const players = match.players.filter(
    (player) => player.id !== credentials.id,
  );

  const handlePlayerClick = (player: OngoingMatchPlayer) => {
    if (active === player.id) setActive(null);
    else setActive(player.id);
  };

  const handleClick = () => {
    if (!active) return;

    action(players.find((player) => player.id === active)!);
    handleClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Layout.Col align="center" gap={10}>
          <Title>select a player</Title>

          <Layout.Row gap={3}>
            {players.map((player) => (
              <Player
                key={player.id}
                active={active === player.id}
                onClick={() => handlePlayerClick(player)}
                gap={2}
              >
                <PlayerAvatar src={player.avatar} />
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

interface PlayerStyledProps {
  active: boolean;
}

const Player = styled(Layout.Col)<PlayerStyledProps>`
  align-items: center;
  justify-content: space-between;
  background-color: ${({theme}) => theme.palette.primary.main};
  border-radius: 1rem;
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

const PlayerAvatar = styled(Avatar)`
  width: 20rem;
  height: 20rem;
`;

const Username = styled(Text)`
  color: #ffffff;
  font-size: 3rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
`;
