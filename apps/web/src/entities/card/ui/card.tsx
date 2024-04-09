import React from "react";
import {css, darken, styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

import {cards} from "../lib/cards";
import {CardName} from "../lib/typings";

interface CardProps extends Omit<React.HTMLProps<HTMLDivElement>, "as"> {
  name: CardName;
  mini?: boolean;
}

export const Card: React.FC<CardProps> = ({name, mini, ...props}) => {
  const {t} = useTranslation("common");

  const isIK = name.startsWith("imploding-kitten");

  const title: CardName = isIK ? "imploding-kitten" : name;

  const details = cards.details[title];

  return (
    <Wrapper
      justify="center"
      align="center"
      gap={mini ? 0 : 2}
      p={1}
      tone={details.tone}
      mini={mini}
      {...props}
    >
      <Title>{t(`card.${title}`)}</Title>
      <Image src={details.image} alt="card image" draggable={false} />
    </Wrapper>
  );
};

interface WrapperStyledProps {
  tone: string;
  mini?: boolean;
}

const Wrapper = styled(Layout.Col)<WrapperStyledProps>`
  width: 16rem;
  height: 21rem;
  background-color: ${({tone}) => darken(tone, 0.3)};
  border: 1rem solid ${({tone}) => tone};
  box-shadow: 0 0 8px 2px ${({tone}) => tone};
  text-align: center;
  border-radius: 1rem;
  cursor: pointer;
  margin: 1rem;

  ${({mini, tone}) =>
    mini &&
    css`
      width: 3rem;
      height: 4rem;
      border: none;
      margin: 0;
      padding: 0;
      box-shadow: 0 0 7.5px 2px ${tone};
      border-radius: 0.5rem;

      span {
        display: none;
      }

      img {
        width: 2rem;
      }
    `}
`;

const Image = styled("img")`
  display: block;
  width: 7rem;
  user-drag: none;
  -webkit-user-drag: none;
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
`;

const Title = styled(Text)`
  color: #ffffff;
  font-size: 1.4rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
  user-select: none;
`;
