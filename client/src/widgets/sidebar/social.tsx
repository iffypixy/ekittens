import * as React from "react";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";

import {Layout} from "@shared/lib/layout";
import {Avatar, H3} from "@shared/ui/atoms";
import {authModel} from "@features/auth";
import {userModel} from "@entities/user";
import {Icon} from "@shared/ui/icons";
import {interimModel} from "@shared/lib/interim";
import {Link} from "react-router-dom";

export const SocialSidebar: React.FC = () => {
  const credentials = useSelector(authModel.selectors.credentials)!;

  const friends = useSelector(userModel.selectors.friends);
  const supplementals = useSelector(interimModel.selectors.supplementals);

  const noFriends = friends.data && friends.data.length === 0;

  return (
    <Wrapper align="center" gap={3}>
      <Profile>
        <Avatar variant="rounded" src={credentials.avatar} size="100%" />
      </Profile>

      <Divider />

      <Friends gap={2}>
        {friends.fetching && <H3>loading...</H3>}

        {noFriends && <NoFriendsIcon />}

        {friends.data &&
          [
            ...friends.data.filter(
              (friend) => supplementals[friend.id]?.status === "online",
            ),
            ...friends.data.filter(
              (friend) => supplementals[friend.id]?.status === "offline",
            ),
          ].map((friend) => {
            const status = supplementals[friend.id]?.status;

            return (
              <Link key={friend.id} to={`/@/${friend.username}`}>
                <Avatar
                  variant="circular"
                  src={friend.avatar}
                  size="100%"
                  online={status === "online"}
                  showStatus={Boolean(status)}
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
