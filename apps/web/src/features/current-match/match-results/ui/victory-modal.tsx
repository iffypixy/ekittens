import React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";
import {useNavigate} from "react-router-dom";

import {useDispatch} from "@app/store";

import {MATCH_RESULT, rating} from "@entities/match";
import {viewerModel} from "@entities/viewer";
import {currentMatchModel} from "@features/current-match";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, H3, Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";

import {model} from "../model";

export const VictoryModal: React.FC = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const credentials = viewerModel.useCredentials();

  const match = currentMatchModel.useMatch()!;

  const results = useSelector(model.selectors.personal);

  const handleClose = () => {
    dispatch(
      model.actions.setPersonalResults({
        results: null,
      }),
    );

    dispatch(
      currentMatchModel.actions.setMatch({
        match: null,
      }),
    );

    navigate("/");
  };

  const isVictory = !!(results?.type === MATCH_RESULT.VICTORY);

  if (!results || !isVictory) return null;

  return (
    <Modal onClose={handleClose} open>
      <Center>
        <Wrapper gap={10}>
          <Title>victory! B)</Title>

          <Layout.Col gap={3} align="center">
            <Layout.Col align="center" gap={1}>
              <Avatar src={credentials.avatar} size={7} />

              <Text color="success" weight={400} font="primary" size={2.4}>
                {credentials.username}
              </Text>
            </Layout.Col>

            <Text color="success" weight={400} size={4.6} font="primary">
              x
            </Text>

            <Layout.Row gap={1}>
              {[...match.players, ...match.out]
                .filter((participant) => participant.id !== credentials.id)
                .map((participant) => (
                  <Layout.Col key={participant.id} align="center" gap={1}>
                    <Avatar src={participant.avatar} size={5} />

                    <Text weight={400} font="primary" size={1.8} color="error">
                      {participant.username}
                    </Text>
                  </Layout.Col>
                ))}
            </Layout.Row>
          </Layout.Col>

          <Layout.Row align="flex-end" gap={1}>
            <Layout.Row align="center" gap={1}>
              <TrophyIcon />
              <Rating>{results.rating}</Rating>
            </Layout.Row>

            <Shift>{rating.adjustShift(results.shift)}</Shift>
          </Layout.Row>

          <Button color="primary" variant="contained" onClick={handleClose}>
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

const Rating = styled(H3)`
  color: ${({theme}) => theme.palette.common.white}; ;
`;

const TrophyIcon = styled(Icon.Trophy)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.common.white};
`;

const Shift = styled(Text)`
  color: ${({theme}) => theme.palette.success.main};
  font-size: 2.2rem;
  font-family: "Bungee", sans-serif;
  margin-bottom: 0.15rem;
`;
