import * as React from "react";
import {useSelector} from "react-redux";
import {
  css,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {useTranslation} from "react-i18next";

import {CommonTemplate} from "@shared/ui/templates";
import {Header, Sidebar} from "@widgets/sidebar";
import {useDispatch} from "@app/store";
import {leaderboardModel} from "@features/leaderboard";
import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

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
                  <Cell>{user.username}</Cell>
                  <Cell>
                    {user.rating} ({user.winrate}%)
                  </Cell>
                  <Cell>
                    <Layout.Row gap={-0.05}>
                      {[...user.history].reverse().map((result, idx) => (
                        <History key={idx} success={result === "victory"}>
                          /
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

interface HistoryStyledProps {
  success: boolean;
}

const History = styled(Text)<HistoryStyledProps>`
  color: ${({theme}) => theme.palette.error.main};
  font-weight: 700;

  ${({success, theme}) =>
    success &&
    css`
      color: ${theme.palette.success.main};
    `}
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
