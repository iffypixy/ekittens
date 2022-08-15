import * as React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, H3, Text} from "@shared/ui/atoms";
import {authModel} from "@features/auth";
import {matchModel} from "@entities/match";
import {Icon} from "@shared/ui/icons";
import {rating} from "@entities/profile/lib/rating";

interface DefeatModalProps {
  open: boolean;
  handleClose: () => void;
}

export const DefeatModal: React.FC<DefeatModalProps> = ({
  open,
  handleClose,
}) => {
  const credentials = useSelector(authModel.selectors.credentials)!;

  const match = useSelector(matchModel.selectors.match)!;
  const result = useSelector(matchModel.selectors.result);

  const handleClick = () => {
    handleClose();
  };

  if (!result) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <Center>
        <Wrapper gap={10}>
          <Layout.Col gap={2}>
            <Title>defeat B(</Title>
            <Reason>
              {result.reason === "ik-explosion"
                ? "imploded by imploding kitten"
                : result.reason === "ek-explosion"
                ? "exploded by exploding kitten"
                : result.reason === "inactivity"
                ? "was inactive too long"
                : null}
            </Reason>
          </Layout.Col>

          <Layout.Col gap={3} align="center">
            <Layout.Col align="center" gap={1}>
              <LoserAvatar src={credentials.avatar} alt="user's avatar" />
              <LoserUsername>{credentials.username}</LoserUsername>
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
            okay
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
  color: ${({theme}) => theme.palette.error.main};
`;

const Against = styled(H3)`
  color: ${({theme}) => theme.palette.error.main};
  font-size: 4.6rem;
`;

const Reason = styled(Text)`
  color: #fff;
  font-weight: 700;
  font-size: 1.6rem;
  text-transform: uppercase;
`;

const LoserAvatar = styled(Avatar)`
  width: 7rem;
  height: 7rem;
`;

const Rating = styled(H3)`
  color: #fff;
`;

const LoserUsername = styled(H3)`
  color: ${({theme}) => theme.palette.error.main};
  font-size: 2.4rem;
`;

const PlayerAvatar = styled(Avatar)`
  width: 5rem;
  height: 5rem;
`;

const PlayerUsername = styled(LoserUsername)`
  color: ${({theme}) => theme.palette.success.main};
  font-size: 1.8rem;
`;

const TrophyIcon = styled(Icon.Trophy)`
  width: 3rem;
  fill: #fff;
`;

const Shift = styled(Text)`
  color: ${({theme}) => theme.palette.error.main};
  font-size: 2.2rem;
  font-family: "Bungee", sans-serif;
  margin-bottom: 0.15rem;
`;
