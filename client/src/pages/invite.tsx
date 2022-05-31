import * as React from "react";
import {useNavigate, useParams} from "react-router-dom";
import {styled} from "@mui/material";

import {CenterTemplate, FullScreenTemplate} from "@shared/ui/templates";
import {useDispatch} from "@shared/lib/store";
import {Button, Input, Text} from "@shared/ui/atoms";
import {Col, Row} from "@shared/lib/layout";
import {AvatarPicker} from "@shared/lib/avatars";
import {lobbyModel} from "@features/lobby";

interface InvitePageParams {
  id: string;
}

export const InvitePage: React.FC = () => {
  const dispatch = useDispatch();

  const {id} = useParams<Partial<InvitePageParams>>();

  const [avatar, setAvatar] = React.useState(0);
  const [username, setUsername] = React.useState("");

  const navigate = useNavigate();

  const handleInputChange = ({
    currentTarget,
  }: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(currentTarget.value);
  };

  const handleJoinButtonClick = () => {
    if (username)
      dispatch(lobbyModel.actions.joinLobby({avatar, username, lobbyId: id!}))
        .unwrap()
        .then(() => {
          navigate("/lobby");
        });
  };

  return (
    <FullScreenTemplate>
      <CenterTemplate>
        <Wrapper gap={6} align="center">
          <Text size={2}>You have been invited to join a lobby</Text>

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
            <Button onClick={handleJoinButtonClick}>Join</Button>
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
