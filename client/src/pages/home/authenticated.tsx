import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";
import {useTranslation} from "react-i18next";

import {Avatar, Button, H3, Loader} from "@shared/ui/atoms";
import {CommonTemplate} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {ProfileHub, ProfileStats} from "@entities/profile";
import {Header, Sidebar} from "@widgets/sidebar";
import {authModel} from "@features/auth";
import {userModel} from "@entities/user";
import {Icon} from "@shared/ui/icons";

export const HomeAuthenticated: React.FC = () => {
  const {t} = useTranslation("home");

  const credentials = useSelector(authModel.selectors.credentials)!;

  const friends = useSelector(userModel.selectors.friends);
  const stats = useSelector(userModel.selectors.stats);
  const matches = useSelector(userModel.selectors.matches);

  const hub = Boolean(friends.data) && Boolean(matches.data);
  const isHubFetching = friends.fetching || matches.fetching;

  if (!credentials) return null;

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />

      <CommonTemplate>
        <Header>{t("header")}</Header>

        <Layout.Row w="100%">
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

            {isHubFetching && <Loader.Spinner />}
            {hub && (
              <ProfileHub matches={matches.data!} friends={friends.data!} own />
            )}
          </Hub>

          <Profile gap={2}>
            <Avatar size={7} src={credentials.avatar} />

            <H3>{credentials.username}</H3>

            {stats.fetching && <Loader.Spinner />}
            {Boolean(stats.data) && <ProfileStats stats={stats.data!} />}
          </Profile>
        </Layout.Row>
      </CommonTemplate>
    </>
  );
};

const Hub = styled(Layout.Col)`
  width: 55%;
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
