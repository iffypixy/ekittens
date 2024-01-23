import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";
import {Link} from "react-router-dom";

import {viewerModel} from "@entities/viewer";
import {userModel} from "@entities/user";

import {Layout} from "@shared/lib/layout";
import {Avatar, H3} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import {UserWithInterim} from "@shared/api/common";

export const SocialSidebar: React.FC = () => {
  const credentials = viewerModel.useCredentials();

  const interims = userModel.useInterims();

  const friends = useSelector(viewerModel.selectors.friends);

  const hasFriends = friends.data && friends.data.length !== 0;

  const friendsWithInterim = friends.data?.map((friend) => ({
    ...friend,
    interim: interims[friend.id],
  })) as UserWithInterim[];

  return (
    <Wrapper align="center" gap={2}>
      <Profile>
        <Avatar src={credentials.avatar} size="100%" />
      </Profile>

      <Divider />

      <Friends gap={2}>
        {friends.fetching && <H3>loading...</H3>}

        {!hasFriends && <NoFriendsIcon />}

        {hasFriends &&
          [...friendsWithInterim!]
            .sort((a, b) => {
              const isOnlineA = a.interim?.status === "online";
              const isOnlienB = b.interim?.status === "online";

              return isOnlineA === isOnlienB ? 0 : isOnlineA ? -1 : 1;
            })
            .map((friend) => {
              const status = friend.interim?.status;

              return (
                <Link key={friend.id} to={`/@/${friend.username}`}>
                  <Avatar
                    src={friend.avatar}
                    size="100%"
                    status={status}
                    showStatus={!!status}
                  />
                </Link>
              );
            })}
      </Friends>
    </Wrapper>
  );
};

const NoFriendsIcon = styled(Icon.KittenJoy)`
  width: 5rem;
  fill: ${({theme}) => theme.palette.text.secondary};
`;

const Wrapper = styled(Layout.Col)`
  width: 10rem;
  height: 100vh;
  background-color: ${({theme}) => theme.palette.background.paper};
  border-left: 2px solid ${({theme}) => theme.palette.divider};
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
  padding: 3rem 0;
`;

const Profile = styled(Layout.Col)`
  width: 80%;
`;

const Divider = styled("div")`
  width: 100%;
  height: 2px;
  background-color: ${({theme}) => theme.palette.divider};
`;

const Friends = styled(Layout.Col)`
  width: 60%;
  align-items: center;
`;
