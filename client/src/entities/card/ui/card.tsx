import * as React from "react";
import {styled} from "@mui/material";

import {Col, Row} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {cards, CardDetails, CardType} from "@entities/card/lib";

interface CardProps {
  type: CardType;
  amount: number;
  active?: boolean;
}

export const Card: React.FC<CardProps> = ({type, amount, active = false}) => {
  const {name, avatar, tone} = cards[type];

  const [isActive, setIsActive] = React.useState<boolean>(active);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <Wrapper w={35} tone={tone} active={isActive} onClick={handleClick}>
      <Content w="100%" align="center" gap={3}>
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

interface WrapperProps extends StylingProps {
  active: boolean;
}

const Wrapper = styled(Col)<WrapperProps>`
  background-color: #ffffff;
  border: 1rem solid ${({tone}) => tone};
  border-radius: 1rem;
  cursor: pointer;
  transition: opacity 0.2s linear;
  opacity: ${({active}) => (active ? 1 : 0.3)};
  margin: 1rem;
`;

const Content = styled(Row)`
  position: relative;
  padding: 2rem;
`;

const Metadata = styled(Text)<StylingProps>`
  color: ${({tone}) => tone};
  font-family: "Bungee", sans-serif;
  font-size: 2.6rem;
  position: absolute;
  bottom: 1rem;
  right: 1rem;
`;

const IMG = styled("img")`
  width: 7.5rem;
`;

const Name = styled(Text)<StylingProps>`
  color: ${({tone}) => tone};
  font-family: "Bungee", sans-serif;
  font-size: 2.4rem;
`;
