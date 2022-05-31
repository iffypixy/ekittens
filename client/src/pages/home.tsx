import * as React from "react";
import {styled} from "@mui/material";
import {useNavigate} from "react-router-dom";

import {Button, Input, Text} from "@shared/ui/atoms";
import {CenterTemplate, FullScreenTemplate} from "@shared/ui/templates";
import {Col, Row} from "@shared/lib/layout";
import {useDispatch} from "@shared/lib/store";
import {AvatarPicker} from "@shared/lib/avatars";
import {lobbyModel} from "@features/lobby";

export const HomePage: React.FC = () => {
  const dispatch = useDispatch();

  const [avatar, setAvatar] = React.useState(0);
  const [username, setUsername] = React.useState("");

  const navigate = useNavigate();

  const handleInputChange = ({
    currentTarget,
  }: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(currentTarget.value);
  };

  const handleStartButtonClick = () => {
    if (username)
      dispatch(lobbyModel.actions.createLobby({avatar, username}))
        .unwrap()
        .then(() => {
          navigate("/lobby");
        });
  };

  return (
    <FullScreenTemplate>
      <CenterTemplate>
        <Wrapper gap={6} align="center">
          <Text size={2}>Create a lobby to play with friends</Text>

          <Row gap={5} align="center">
            <AvatarPicker handleReset={setAvatar} />

            <Col gap={3}>
              <Text uppercase>Choose an avatar and a username</Text>

              <Input
                value={username}
                onChange={handleInputChange}
                placeholder="best_player228"
              />
            </Col>
          </Row>

          <Row w="100%" justify="center">
            <Button onClick={handleStartButtonClick}>Start</Button>
          </Row>
        </Wrapper>
      </CenterTemplate>
    </FullScreenTemplate>
  );
};

const Wrapper = styled(Col)`
  background-color: #ffffff;
  box-shadow: 0 0 0 1rem rgba(0, 0, 0, 0.05);
  border-radius: 2rem;
  padding: 5rem;
`;
