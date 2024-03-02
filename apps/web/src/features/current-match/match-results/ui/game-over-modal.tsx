import React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";
import {useNavigate} from "react-router-dom";

import {useDispatch} from "@app/store";
import {currentMatchModel} from "@features/current-match";

import {Modal} from "@shared/lib/modal";
import {Center} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, Button, H1, H3, Text} from "@shared/ui/atoms";

import {model} from "../model";

export const GameOverModal: React.FC = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const match = currentMatchModel.useMatch()!;

  const results = useSelector(model.selectors.general)!;
  const personal = useSelector(model.selectors.personal);

  const handleClose = () => {
    dispatch(
      model.actions.setGeneralResults({
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

  if (!results || !!personal) return null;

  return (
    <Modal onClose={handleClose} open>
      <Center>
        <Wrapper gap={10}>
          <Title>game over</Title>

          <Layout.Col gap={3} align="center">
            <Layout.Col align="center" gap={1}>
              <Avatar src={results.winner.avatar} size={7} />

              <Text weight={400} font="primary" size={2.4} color="success">
                {results.winner.username}
              </Text>
            </Layout.Col>

            <Against>x</Against>

            <Layout.Row gap={1}>
              {[...match.players, ...match.out]
                .filter((participant) => participant.id !== results.winner.id)
                .map((participant) => (
                  <Layout.Col key={participant.id} align="center" gap={1}>
                    <Avatar src={participant.avatar} size={5} />

                    <Text color="error" weight={400} font="primary" size={1.8}>
                      {participant.username}
                    </Text>
                  </Layout.Col>
                ))}
            </Layout.Row>
          </Layout.Col>

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
  color: ${({theme}) => theme.palette.common.white}; ;
`;

const Against = styled(H3)`
  color: ${({theme}) => theme.palette.common.white};
  font-size: 4.6rem;
`;
