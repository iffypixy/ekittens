import * as React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {Card} from "@entities/card";
import {matchModel} from "@entities/match";
import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

export const DiscardPile: React.FC = () => {
  const {t} = useTranslation(["common", "match"]);

  const match = useSelector(matchModel.selectors.match)!;

  const noCards = match.discard.length === 0;
  const last = match.discard[match.discard.length - 1];

  const by = match.players.find((player) => player.id === match.last);

  return (
    <Wrapper id="discard-pile">
      <Box>
        {noCards ? (
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
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #212121;
  text-align: center;
`;

const Title = styled(Text)`
  color: #ffffff;
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
