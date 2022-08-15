import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";
import {useTranslation} from "react-i18next";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {matchModel} from "@entities/match";

export const ExplodingKittenProbability: React.FC = () => {
  const {t} = useTranslation("match");

  const match = useSelector(matchModel.selectors.match)!;

  const amount = match.players.length + match.out.length;

  const min = Math.floor(((amount - 1) / match.draw) * 100);
  const max = Math.floor((amount / match.draw) * 100);

  return (
    <Wrapper gap={1}>
      <Title>{t("ek-chance")}</Title>
      <Number>
        {min}% - {max}%
      </Number>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  max-width: 20rem;
  border-radius: 1rem;
  background: ${({theme}) => theme.palette.background.paper};
  border: 2px solid ${({theme}) => theme.palette.divider};
  text-align: center;
  padding: 2rem;
`;

const Title = styled(Text)`
  font-family: "Bungee", sans-serif;
  font-size: 1.4rem;
  text-transform: uppercase;
`;

const Number = styled(Text)`
  font-family: "Bungee", sans-serif;
  font-size: 1.6rem;
  text-transform: uppercase;
`;
