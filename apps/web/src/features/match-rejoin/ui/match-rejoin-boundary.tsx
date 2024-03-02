import React from "react";
import {styled} from "@mui/material";
import {useLocation, useNavigate} from "react-router-dom";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";
import {viewerModel} from "@entities/viewer";
import {Card} from "@entities/card";

import {Fullscreen, Center} from "@shared/ui/templates";
import {Button, H3, Text} from "@shared/ui/atoms";
import {Layout} from "@shared/lib/layout";
import {OngoingMatch} from "@shared/api/common";

import {model} from "../model";

interface MatchRejoinBoundaryProps {
  children: React.ReactNode;
}

export const MatchRejoinBoundary: React.FC<MatchRejoinBoundaryProps> = ({
  children,
}) => {
  const dispatch = useDispatch();

  const location = useLocation();

  const navigate = useNavigate();

  const [match, setMatch] = React.useState<OngoingMatch | null>(null);

  const shouldCheck = useSelector(model.selectors.shouldCheck);

  React.useEffect(() => {
    if (shouldCheck) {
      dispatch(viewerModel.actions.fetchOngoingMatch())
        .unwrap()
        .then((res) => {
          const isInMatch = location.pathname === `/${res.match.id}`;

          if (!isInMatch) setMatch(res.match);
        })
        .catch(() => {})
        .finally(() => {
          dispatch(
            model.actions.setShouldCheck({
              shouldCheck: false,
            }),
          );
        });
    }
  }, [shouldCheck]);

  if (!match) return <>{children}</>;

  const handleRejoinButtonClick = () => {
    setMatch(null);

    navigate(`/${match!.id}`);
  };

  return (
    <Fullscreen>
      <Center>
        <Layout.Row align="center" gap={2}>
          <Card name="nope" />

          <Layout.Col w={30} gap={2}>
            <H3>rejoin?</H3>

            <Text emphasis="secondary" transform="lowercase">
              Hey, seems you disconnected from an active game. You have to
              reconnect / end the game before you can join another room.
            </Text>

            <Border />

            <Button
              variant="contained"
              color="info"
              onClick={handleRejoinButtonClick}
            >
              rejoin to the game
            </Button>
          </Layout.Col>
        </Layout.Row>
      </Center>
    </Fullscreen>
  );
};

const Border = styled("div")`
  width: 100%;
  height: 2px;
  background-color: ${({theme}) => theme.palette.divider};
`;
