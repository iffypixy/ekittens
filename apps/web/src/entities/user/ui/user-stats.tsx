import React from "react";
import {styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {UserStats as IUserStats} from "@shared/api/common";

export interface UserStatsProps {
  stats: IUserStats;
}

export const UserStats: React.FC<UserStatsProps> = ({stats}) => {
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

interface UserStatsItemProps {
  parameter: string;
  value: number;
}

const Item: React.FC<UserStatsItemProps> = ({parameter, value}) => (
  <Wrapper justify="space-between" align="flex-end">
    <StatKey weight={700} transform="uppercase">
      {parameter}
    </StatKey>
    <Text size={3} weight={700}>
      {value}
    </Text>
  </Wrapper>
);

const StatKey = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
`;

const Wrapper = styled(Layout.Row)`
  border-bottom: 2px solid ${({theme}) => theme.palette.divider};
  padding-bottom: 1rem;
`;
