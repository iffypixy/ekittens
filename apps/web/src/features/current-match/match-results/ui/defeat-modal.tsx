import React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";

import {useDispatch} from "@app/store";
import {MATCH_RESULT, rating} from "@entities/match";
import {viewerModel} from "@entities/viewer";
import {currentMatchModel} from "@features/current-match";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, H3, Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";

import {DEFEAT_REASON} from "../lib/reasons";
import {model} from "../model";

export const DefeatModal: React.FC = () => {
  const dispatch = useDispatch();

  const credentials = viewerModel.useCredentials();

  const match = currentMatchModel.useMatch()!;

  const results = useSelector(model.selectors.personal);

  const handleClose = () => {
    dispatch(
      model.actions.setPersonalResults({
        results: null,
      }),
    );
  };

  const isDefeat = !!(results?.type === MATCH_RESULT.DEFEAT);

  if (!results || !isDefeat) return null;

  return (
    <Modal onClose={handleClose} open>
      <Center>
        <Wrapper gap={10}>
          <Layout.Col gap={2}>
            <Title>defeat B(</Title>

            <Reason>
              {results.reason === DEFEAT_REASON.EBIK
                ? "imploded by imploding kitten"
                : results.reason === DEFEAT_REASON.EBEK
                ? "exploded by exploding kitten"
                : results.reason === DEFEAT_REASON.WIFTL
                ? "was inactive for too long"
                : null}
            </Reason>
          </Layout.Col>

          <Layout.Col gap={3} align="center">
            <Layout.Col align="center" gap={1}>
              <Avatar size={7} src={credentials.avatar} />

              <Text
                color="error"
                size={2.4}
                font="primary"
                weight={400}
                transform="uppercase"
              >
                {credentials.username}
              </Text>
            </Layout.Col>

            <Text font="primary" size={4.6} weight={400} color="error">
              x
            </Text>

            <Layout.Row gap={1}>
              {[...match.players, ...match.out]
                .filter((participant) => participant.id !== credentials.id)
                .map((participant) => (
                  <Layout.Col key={participant.id} align="center" gap={1}>
                    <Avatar size={5} src={participant.avatar} />

                    <Text
                      color="success"
                      font="primary"
                      weight={400}
                      size={1.8}
                      transform="uppercase"
                    >
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

const Reason = styled(Text)`
  color: ${({theme}) => theme.palette.common.white};
  font-weight: 700;
  font-size: 1.6rem;
  text-transform: uppercase;
`;

const Rating = styled(H3)`
  color: ${({theme}) => theme.palette.common.white};
`;

const TrophyIcon = styled(Icon.Trophy)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.common.white};
`;

const Shift = styled(Text)`
  color: ${({theme}) => theme.palette.error.main};
  font-size: 2.2rem;
  font-family: "Bungee", sans-serif;
  margin-bottom: 0.15rem;
`;
