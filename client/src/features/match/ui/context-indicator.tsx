import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";
import {useTranslation} from "react-i18next";

import {Layout} from "@shared/lib/layout";
import {matchModel} from "@entities/match";
import nopecard from "@shared/assets/cards/nope.png";
import implodingkittencard from "@shared/assets/cards/imploding-kitten.png";
import reversecard from "@shared/assets/cards/reverse.png";
import attackcard from "@shared/assets/cards/attack.png";
import {Text} from "@shared/ui/atoms";

export const ContextIndicator: React.FC = () => {
  const {t} = useTranslation("common");

  const match = useSelector(matchModel.selectors.match)!;

  return (
    <Wrapper gap={2}>
      <Layout.Row align="center" gap={2}>
        <Indicator src={nopecard} />
        {match.context.noped ? <On>{t("w.on")}</On> : <Off>{t("w.off")}</Off>}
      </Layout.Row>

      <Layout.Row align="center" gap={2}>
        <Indicator src={reversecard} />
        {match.context.reversed ? (
          <On>{t("w.on")}</On>
        ) : (
          <Off>{t("w.off")}</Off>
        )}
      </Layout.Row>

      <Layout.Row align="center" gap={2}>
        <Indicator src={attackcard} />
        <Value>{match.context.attacks}</Value>
      </Layout.Row>

      <Layout.Row align="center" gap={2}>
        <Indicator src={implodingkittencard} />
        <Value>
          {typeof match.context.ikspot === "number"
            ? match.draw - match.context.ikspot - 1
            : "N/A"}
        </Value>
      </Layout.Row>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  border-radius: 1rem;
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

const On = styled(Value)`
  color: ${({theme}) => theme.palette.success.main};
`;

const Off = styled(Value)`
  color: ${({theme}) => theme.palette.error.main};
`;
