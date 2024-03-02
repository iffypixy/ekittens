import React from "react";
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {Card} from "@entities/card";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

import {model} from "../model";

export const DiscardPile: React.FC = () => {
  const {t} = useTranslation(["common", "match"]);

  const match = model.useMatch()!;

  const isPileEmpty = match.discard.length === 0;

  const last = match.discard[match.discard.length - 1];
  const by = match.players.find((player) => player.id === match.last);

  return (
    <Wrapper id="discard-pile">
      <Box>
        {isPileEmpty ? (
          <Pile>
            <Title>{t("discard-title", {ns: "match"})}</Title>
          </Pile>
        ) : (
          <DiscardCard name={last} />
        )}
      </Box>

      {by && (
        <By>
          {t("w.by", {ns: "common"})} {by.username}
        </By>
      )}
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  text-align: center;
`;

const Box = styled(Layout.Col)`
  width: 16rem;
  height: 21rem;
  border: 1rem solid #556565;
  border-radius: 1rem;
  box-shadow: 0 0 10px 5px #556565;
`;

const Pile = styled(Layout.Col)`
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  background-color: #212121;
  text-align: center;
`;

const Title = styled(Text)`
  color: ${({theme}) => theme.palette.common.white};
  font-family: "Bungee", sans-serif;
  font-size: 2.6rem;
  text-transform: uppercase;
`;

const DiscardCard = styled(Card)`
  width: 100%;
  height: 100%;
  border-radius: 0;
  margin: 0;
`;

const By = styled(Text)`
  font-size: 1.4rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
  margin-top: 1.5rem;
`;
