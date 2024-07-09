import React from "react";
import {useSelector} from "react-redux";
import {
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {useTranslation} from "react-i18next";

import {Header, Sidebar} from "@widgets/sidebar";
import {useDispatch} from "@app/store";
import {leaderboardModel} from "@entities/leaderboard";

import {CommonTemplate} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Link, Text} from "@shared/ui/atoms";

export const LeaderboardPage: React.FC = () => {
  const {t} = useTranslation("leaderboard");

  const dispatch = useDispatch();

  const leaderboard = useSelector(leaderboardModel.selectors.leaderboard);

  React.useEffect(() => {
    dispatch(leaderboardModel.actions.fetchLeaderboard());
  }, []);

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />

      <CommonTemplate>
        <Header>{t("header")}</Header>

        <TContainer>
          <Table>
            <TableHead>
              <TableRow>
                <Property>#</Property>
                <Property>{t("w.username")}</Property>
                <Property>{t("w.rating")}</Property>
                <Property>{t("w.performance")}</Property>
              </TableRow>
            </TableHead>

            <TableBody>
              {leaderboard.map((user, idx) => (
                <TableRow key={user.id}>
                  <Cell>{idx + 1}</Cell>
                  <Cell>
                    <PlayerLink to={`/@/${user.username}`}>
                      {user.username}
                    </PlayerLink>
                  </Cell>
                  <Cell>
                    {user.rating} ({user.winrate}%)
                  </Cell>
                  <Cell>
                    <Layout.Row gap={-0.05}>
                      {[...user.history].reverse().map((result, idx) => (
                        <History
                          key={idx}
                          type={result === "victory" ? "success" : "error"}
                        >
                          {result === "victory" ? "W" : "L"}
                        </History>
                      ))}
                    </Layout.Row>
                  </Cell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TContainer>
      </CommonTemplate>
    </>
  );
};

const PlayerLink = styled(Link)`
  color: ${({theme}) => theme.palette.text.secondary};
  text-decoration: underline;
`;

interface HistoryStyledProps {
  type: "error" | "success";
}

const History = styled(Text)<HistoryStyledProps>`
  color: ${({theme, type}) => theme.palette[type].main};
  font-weight: 700;
`;

const Cell = styled(TableCell)`
  font-family: "Miriam Libre", sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  text-transform: uppercase;
`;

const Property = styled(Cell)`
  color: ${({theme}) => theme.palette.text.secondary};
`;

const TContainer = styled(TableContainer)`
  border: 1px solid ${({theme}) => theme.palette.divider};
  background-color: ${({theme}) => theme.palette.background.default};
  border-radius: 1rem;
`;
