import * as React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";
import {useNavigate} from "react-router-dom";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, H3} from "@shared/ui/atoms";
import {matchModel} from "@entities/match";

interface GameOverModalProps {
  open: boolean;
  handleClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  open,
  handleClose,
}) => {
  const navigate = useNavigate();

  const match = useSelector(matchModel.selectors.match)!;

  const winner = match.players[0];

  const handleClick = () => {
    handleClose();

    navigate("/");
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Wrapper gap={10}>
          <Title>game over</Title>

          <Layout.Col gap={3} align="center">
            <Layout.Col align="center" gap={1}>
              <WinnerAvatar src={winner.avatar} alt="user's avatar" />
              <WinnerUsername>{winner.username}</WinnerUsername>
            </Layout.Col>

            <Against>x</Against>

            <Layout.Row gap={1}>
              {[...match.players, ...match.out]
                .filter((participant) => participant.id !== winner.id)
                .map((participant) => (
                  <Layout.Col key={participant.id} align="center" gap={1}>
                    <PlayerAvatar
                      src={participant.avatar}
                      alt={`${participant.username}'s avatar`}
                    />

                    <PlayerUsername>{participant.username}</PlayerUsername>
                  </Layout.Col>
                ))}
            </Layout.Row>
          </Layout.Col>

          <Button color="primary" variant="contained" onClick={handleClick}>
            back to home
          </Button>
        </Wrapper>
      </Center>
    </Modal>
  );
};

const Wrapper = styled(Layout.Col)`
  align-items: center;
  text-align: center;
`;

const Title = styled(H1)`
  color: #fff;
`;

const Against = styled(H3)`
  color: #fff;
  font-size: 4.6rem;
`;

const WinnerAvatar = styled(Avatar)`
  width: 7rem;
  height: 7rem;
`;

const WinnerUsername = styled(H3)`
  color: ${({theme}) => theme.palette.success.main};
  font-size: 2.4rem;
`;

const PlayerAvatar = styled(Avatar)`
  width: 5rem;
  height: 5rem;
`;

const PlayerUsername = styled(WinnerUsername)`
  color: ${({theme}) => theme.palette.error.main};
  font-size: 1.8rem;
`;
