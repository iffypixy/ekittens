import * as React from "react";
import {styled} from "@mui/material";

import {Fullscreen, Center} from "@shared/ui/templates";
import {Button, H3, Text} from "@shared/ui/atoms";
import {Card} from "@entities/card";
import {Layout} from "@shared/lib/layout";

export interface RejoinMatchBoundaryProps {
  children: React.ReactNode;
}

export const RejoinMatch: React.FC<RejoinMatchBoundaryProps> = ({children}) => {
  const shouldRejoin = false;

  if (!shouldRejoin) return <>{children}</>;

  return (
    <Fullscreen>
      <Center>
        <Layout.Row align="center" gap={2}>
          <Card name="nope" />

          <Layout.Col w={30} gap={2}>
            <H3>rejoin?</H3>

            <Help color="secondary">
              Hey, seems you disconnected from an active game. You have to
              reconnect / end the game before you can join another room.
            </Help>

            <Border />

            <Button variant="contained" color="info">
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

const Help = styled(Text)`
  text-transform: lowercase;
`;
