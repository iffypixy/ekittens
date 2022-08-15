import * as React from "react";
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {ProfileStatistics} from "@shared/api/common";

export interface ProfileStatsProps {
  stats: ProfileStatistics;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({stats}) => {
  const {t} = useTranslation("common");

  return (
    <Layout.Col gap={2}>
      <Item parameter={t("w.rating")} value={stats.rating} />
      <Item parameter={`${t("w.winrate")} %`} value={stats.winrate} />
      <Item parameter={t("w.games-played")} value={stats.played} />
      <Item parameter={t("w.games-won")} value={stats.won} />
      <Item parameter={t("w.games-lost")} value={stats.lost} />
    </Layout.Col>
  );
};

interface ProfileStatsItemProps {
  parameter: string;
  value: number;
}

const Item: React.FC<ProfileStatsItemProps> = ({parameter, value}) => (
  <Wrapper justify="space-between" align="flex-end">
    <Parameter>{parameter}</Parameter>
    <Value>{value}</Value>
  </Wrapper>
);

const Wrapper = styled(Layout.Row)`
  border-bottom: 2px solid ${({theme}) => theme.palette.divider};
  padding-bottom: 1rem;
`;

const Parameter = styled(Text)`
  font-weight: 700;
  text-transform: uppercase;
`;

const Value = styled(Text)`
  font-size: 3rem;
  font-weight: 700;
`;
