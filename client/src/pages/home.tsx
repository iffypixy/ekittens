import * as React from "react";
import {styled} from "@mui/material";

import {Button, Input, Text} from "@shared/ui/atoms";
import {CenterTemplate, FullScreenTemplate} from "@shared/ui/templates";
import {Col, Row} from "@shared/lib/layout";
import {AvatarPicker} from "@entities/avatar";

export const HomePage: React.FC = () => (
  <FullScreenTemplate>
    <CenterTemplate>
      <Wrapper gap={6}>
        <Row gap={5} align="center">
          <AvatarPicker />

          <Col gap={3}>
            <Text uppercase>Choose an avatar and a username</Text>

            <Input placeholder="best_player228" />
          </Col>
        </Row>

        <Row w="100%" justify="center">
          <Button>Start</Button>
        </Row>
      </Wrapper>
    </CenterTemplate>
  </FullScreenTemplate>
);

const Wrapper = styled(Col)`
  background-color: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
  border-radius: 2rem;
  padding: 5rem;
`;
