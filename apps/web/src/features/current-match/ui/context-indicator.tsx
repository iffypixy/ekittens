import React from "react";
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import implodingkittencard from "@shared/assets/cards/imploding-kitten.png";
import reversecard from "@shared/assets/cards/reverse.png";
import attackcard from "@shared/assets/cards/attack.png";

import {model} from "../model";

export const ContextIndicator: React.FC = () => {
  const {t} = useTranslation("common");

  const match = model.useMatch()!;

  return (
    <Wrapper gap={2}>
      <Layout.Row
        align="center"
        gap={2}
        title="Whether the turn order is reversed or not"
      >
        <Indicator src={reversecard} />

        {match.context.reversed ? (
          <Value color="success">{t("w.on")}</Value>
        ) : (
          <Value color="error">{t("w.off")}</Value>
        )}
      </Layout.Row>

      <Layout.Row
        align="center"
        gap={2}
        title='Number of "attacks" on current player'
      >
        <Indicator src={attackcard} />
        <Value>{match.context.attacks}</Value>
      </Layout.Row>

      <Layout.Row
        align="center"
        gap={2}
        title='Number of cards until "Imploding Kitten"'
      >
        <Indicator src={implodingkittencard} />

        <Value>
          {typeof match.context.ikspot === "number"
            ? match.context.ikspot
            : "N/A"}
        </Value>
      </Layout.Row>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  border-radius: 10px;
  background: ${({theme}) => theme.palette.background.paper};
  border: 2px solid ${({theme}) => theme.palette.divider};
  padding: 3rem;
`;

const Indicator = styled("img")`
  max-width: 3rem;
  max-height: 3rem;
  object-fit: contain;
`;

const Value = styled(Text)`
  font-size: 1.4rem;
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
`;
