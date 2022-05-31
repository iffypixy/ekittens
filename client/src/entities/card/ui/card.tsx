import * as React from "react";
import {styled} from "@mui/material";

import {Col} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {deck, CardDetails, CardType} from "../lib";

interface CardProps {
  type: CardType;
  amount: number;
}

export const Card: React.FC<CardProps> = ({type, amount}) => {
  const {tone, name, avatar} = deck[type];

  return (
    <Wrapper w={15} h={20} tone={tone}>
      <Content w="100%" h="100%" align="center" justify="space-between">
        <IMG src={avatar} alt={name} />
        <Name tone={tone}>{name}</Name>
        <Metadata tone={tone}>X{amount}</Metadata>
      </Content>
    </Wrapper>
  );
};

interface StylingProps {
  tone: CardDetails["tone"];
}

const shouldForwardProp = (prop: string) => !["tone"].includes(prop);

const Wrapper = styled(Col, {shouldForwardProp})<StylingProps>`
  background-color: #ffffff;
  border: 0.5rem solid ${({tone}) => tone};
  border-radius: 1rem;
  cursor: pointer;
  transition: opacity 0.2s linear;
  margin: 1rem;
`;

const Content = styled(Col)`
  padding: 1rem;
`;

const Metadata = styled(Text, {shouldForwardProp})<StylingProps>`
  color: ${({tone}) => tone};
  font-family: "Bungee", sans-serif;
  font-size: 2rem;
`;

const IMG = styled("img")`
  width: 5rem;
`;

const Name = styled(Text, {shouldForwardProp})<StylingProps>`
  color: ${({tone}) => tone};
  font-family: "Bungee", sans-serif;
  font-size: 2rem;
  text-align: center;
`;
