import * as React from "react";
import {styled} from "@mui/material";

import {Col} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {deck, CardDetails, CardType} from "../lib";

export interface CardProps {
  type: CardType;
  amount: number;
  w?: number;
  h?: number;
  special?: "exploding-kitten" | "defuse";
  id?: string;
  opacity?: number;
}

export const Card: React.FC<CardProps> = ({
  type,
  amount,
  w,
  h,
  special,
  id,
  opacity,
}) => {
  const {tone, name, avatar} = deck[type];

  if (special === "exploding-kitten")
    return (
      <Special tone="#000" bg="#fff" justify="center" align="center" gap={4}>
        <IMG w={6.5} src={avatar} alt="avatar" />
        <Name size={3.8} tone="#000">
          exploding-kitten
        </Name>
      </Special>
    );

  if (special === "defuse")
    return (
      <Special
        tone="#8FBC5C"
        bg="#000"
        justify="center"
        align="center"
        gap={4}
        id={id}
      >
        <IMG w={6.5} src={avatar} alt="avatar" />
        <Name size={3.8} tone={tone}>
          defuse here
        </Name>
      </Special>
    );

  return (
    <Wrapper w={w || 15} h={h || 20} tone={tone} opacity={opacity}>
      <Content w="100%" h="100%" align="center" justify="space-between">
        <IMG w={5} src={avatar} alt={name} />
        <Name tone={tone}>{name}</Name>
        <Metadata tone={tone}>X{amount}</Metadata>
      </Content>
    </Wrapper>
  );
};

interface StylingProps {
  tone: CardDetails["tone"];
  opacity?: number;
}

const shouldForwardProp = (prop: string) => !["tone"].includes(prop);

interface SpecialStylingProps {
  tone: string;
  bg: string;
}

const Special = styled(Col)<SpecialStylingProps>`
  color: ${({tone}) => tone};
  width: 20rem;
  height: 25rem;
  background-color: ${({bg}) => bg};
  border: 1rem solid ${({tone}) => tone};
  border-radius: 1rem;
  cursor: pointer;
  transition: opacity 0.2s linear;
  margin: 1rem;
`;

const Wrapper = styled(Col, {shouldForwardProp})<StylingProps>`
  background-color: #ffffff;
  border: 0.5rem solid ${({tone}) => tone};
  border-radius: 1rem;
  cursor: pointer;
  transition: opacity 0.2s linear;
  margin: 1rem;
  opacity: ${({opacity}) => opacity};

  /* @media (max-width: 480px) {
    width: 10rem !important;
    height: 15rem !important;
  } */
`;

const Content = styled(Col)`
  padding: 1rem;
`;

const Metadata = styled(Text, {shouldForwardProp})<StylingProps>`
  color: ${({tone}) => tone};
  font-family: "Bungee", sans-serif;
  font-size: 2rem;
`;

const IMG = styled("img")<{w?: number}>`
  width: ${({w}) => `${w}rem` || "5rem"};
`;

const Name = styled(Text, {shouldForwardProp})<StylingProps>`
  color: ${({tone}) => tone};
  font-family: "Bungee", sans-serif;
  font-size: 2rem;
  text-align: center;
`;
