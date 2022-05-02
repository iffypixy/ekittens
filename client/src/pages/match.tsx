import * as React from "react";
import {styled} from "@mui/material";

import {MainTemplate} from "@shared/ui/templates";
import {Card} from "@entities/card";

export const MatchPage: React.FC = () => (
  <MainTemplate>
    <Wrapper>
      <Board />
      <Deck>
        <Card type="exploding-kitten" amount={3} />
        <Card type="defuse" amount={3} />
        <Card type="favor" amount={1} />
        <Card type="attack" amount={4} />
        <Card type="nope" amount={2} />
        <Card type="shuffle" amount={6} />
        <Card type="skip" amount={2} />
      </Deck>
    </Wrapper>
  </MainTemplate>
);

const Wrapper = styled("div")`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: row;
`;

const Board = styled("div")`
  width: 75%;
  height: 100%;
`;

const Deck = styled("div")`
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-left: 1rem solid #b9b7bd;
  overflow-y: auto;
`;
