import React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";

import {viewerModel} from "@entities/viewer";
import {UserHub, UserStats} from "@entities/user";
import {Header, Sidebar} from "@widgets/sidebar";

import {Icon} from "@shared/ui/icons";
import {Avatar, Button, H3} from "@shared/ui/atoms";
import {CommonTemplate} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";

export const HomePage: React.FC = () => {
  const {t} = useTranslation("home");

  const credentials = viewerModel.useCredentials();

  const friends = useSelector(viewerModel.selectors.friends);
  const matches = useSelector(viewerModel.selectors.matches);
  const stats = useSelector(viewerModel.selectors.stats);

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />

      <CommonTemplate>
        <Header>{t("header")}</Header>

        <Layout.Row w="100%" justify="space-between">
          <Hub gap={5}>
            <Layout.Col gap={2}>
              <H3>{t("greeting")}</H3>

              <Layout.Row gap={2}>
                <Link to="/play" style={{textDecoration: "none"}}>
                  <Button
                    color="primary"
                    variant="contained"
                    endIcon={<StartIcon />}
                  >
                    {t("play")}
                  </Button>
                </Link>
              </Layout.Row>
            </Layout.Col>

            <UserHub matches={matches.data} friends={friends.data} isOwn />
          </Hub>

          <Profile gap={2}>
            <Avatar size={7} src={credentials.avatar} />

            <H3>{credentials.username}</H3>

            {stats.data && <UserStats stats={stats.data} />}
          </Profile>
        </Layout.Row>
      </CommonTemplate>
    </>
  );
};

const Hub = styled(Layout.Col)`
  width: 45%;
  text-align: left;
`;

const Profile = styled(Layout.Col)`
  width: 45%;
  text-align: left;
`;

const StartIcon = styled(Icon.Start)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.primary.contrastText};
`;
