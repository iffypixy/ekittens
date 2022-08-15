import * as React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";
import {useNavigate} from "react-router-dom";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, H3, Text} from "@shared/ui/atoms";
import {authModel} from "@features/auth";
import {matchModel} from "@entities/match";
import {Icon} from "@shared/ui/icons";
import {rating} from "@entities/profile/lib/rating";

interface VictoryModalProps {
  open: boolean;
  handleClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  open,
  handleClose,
}) => {
  const navigate = useNavigate();

  const credentials = useSelector(authModel.selectors.credentials)!;

  const match = useSelector(matchModel.selectors.match)!;
  const result = useSelector(matchModel.selectors.result);

  const handleClick = () => {
    handleClose();

    navigate("/");
  };

  if (!result) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Wrapper gap={10}>
          <Title>victory! B)</Title>

          <Layout.Col gap={3} align="center">
            <Layout.Col align="center" gap={1}>
              <WinnerAvatar src={credentials.avatar} alt="user's avatar" />
              <WinnerUsername>{credentials.username}</WinnerUsername>
            </Layout.Col>

            <Against>x</Against>

            <Layout.Row gap={1}>
              {[...match.players, ...match.out]
                .filter((participant) => participant.id !== credentials.id)
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

          <Layout.Row align="flex-end" gap={1}>
            <Layout.Row align="center" gap={1}>
              <TrophyIcon />
              <Rating>{result.rating}</Rating>
            </Layout.Row>

            <Shift>{rating.adjustShift(result.shift)}</Shift>
          </Layout.Row>

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
  color: ${({theme}) => theme.palette.success.main};
`;

const Against = styled(H3)`
  color: ${({theme}) => theme.palette.success.main};
  font-size: 4.6rem;
`;

const WinnerAvatar = styled(Avatar)`
  width: 7rem;
  height: 7rem;
`;

const Rating = styled(H3)`
  color: #fff;
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

const TrophyIcon = styled(Icon.Trophy)`
  width: 3rem;
  fill: #fff;
`;

const Shift = styled(Text)`
  color: ${({theme}) => theme.palette.success.main};
  font-size: 2.2rem;
  font-family: "Bungee", sans-serif;
  margin-bottom: 0.15rem;
`;
