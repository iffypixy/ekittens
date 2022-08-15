import * as React from "react";
import {styled} from "@mui/material";
import {useParams} from "react-router-dom";
import {useSelector} from "react-redux";

import {CommonTemplate} from "@shared/ui/templates";
import {Avatar, Button, Text} from "@shared/ui/atoms";
import {Layout} from "@shared/lib/layout";
import {
  ProfileHub,
  profileModel,
  ProfileStats,
  RELATIONSHIP_STATUS,
} from "@entities/profile";
import {Icon} from "@shared/ui/icons";
import {styling} from "@shared/lib/styling";
import {Header, Sidebar} from "@widgets/sidebar";
import {useDispatch} from "@app/store";
import {userModel} from "@entities/user";
import {interimModel} from "@shared/lib/interim";
import {authModel} from "@features/auth";
import {useSnackbar} from "notistack";

interface UserPageParams {
  username: string;
}

export const UserPage: React.FC = () => {
  const dispatch = useDispatch();

  const {username} = useParams<Partial<UserPageParams>>() as UserPageParams;

  const {enqueueSnackbar} = useSnackbar();

  const credentials = useSelector(authModel.selectors.credentials)!;

  const user = useSelector(profileModel.selectors.user);
  const stats = useSelector(profileModel.selectors.stats);
  const matches = useSelector(profileModel.selectors.matches);
  const friends = useSelector(profileModel.selectors.friends);
  const supplementals = useSelector(interimModel.selectors.supplementals);

  React.useEffect(() => {
    dispatch(profileModel.actions.fetchStats({username}));
    dispatch(profileModel.actions.fetchMatches({username}));

    dispatch(profileModel.actions.fetchUser({username}))
      .unwrap()
      .then((res) =>
        dispatch(
          interimModel.actions.fetchUserSupplemental({ids: [res.user.id]}),
        ),
      );

    dispatch(profileModel.actions.fetchFriends({username}))
      .unwrap()
      .then((res) =>
        dispatch(
          interimModel.actions.fetchUserSupplemental({
            ids: res.friends.map((friend) => friend.id),
          }),
        ),
      );
  }, [username]);

  const supplemental = user.data ? supplementals[user.data.id] : null;

  const hub = Boolean(matches.data) && Boolean(friends.data);

  let activity: React.ReactNode | null = null;

  const hasActivity = supplemental?.activity;
  const isOnline = supplemental?.status === "online";

  if (hasActivity) {
    const type = supplemental.activity.type;

    if (type === "in-match") {
      activity = (
        <>
          <GamepadIcon />
          <Activity>playing in a game</Activity>
        </>
      );
    } else if (type === "spectate") {
      activity = (
        <>
          <EyeIcon />
          <Activity>spectating an ongoing game</Activity>
        </>
      );
    }
  }

  const isMe = credentials.username === username;

  const handleAddFriendButton = () => {
    if (!user) return;

    dispatch(userModel.actions.sendFriendRequest({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(profileModel.actions.setRelationship(res.status));
        enqueueSnackbar(
          `You successfully sent a friend request to ${user.data?.username}`,
          {variant: "success"},
        );
      });
  };

  const handleUnfriendButton = () => {
    if (!user) return;

    dispatch(userModel.actions.unfriend({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(profileModel.actions.setRelationship(res.status));

        enqueueSnackbar(`You successfully unfriended ${user.data?.username}`, {
          variant: "success",
        });
      });
  };

  const handleAcceptFriendRequestButton = () => {
    if (!user) return;

    dispatch(userModel.actions.acceptFriendRequest({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(profileModel.actions.setRelationship(res.status));
        dispatch(userModel.actions.addFriend(user.data!));

        enqueueSnackbar(
          `You successfully accepted friend request from ${user.data?.username}`,
          {variant: "success"},
        );
      });
  };

  const handleRevokeFriendRequestButton = () => {
    if (!user) return;

    dispatch(userModel.actions.revokeFriendRequest({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(profileModel.actions.setRelationship(res.status));

        enqueueSnackbar(
          `You successfully revoked your friend request to ${user.data?.username}`,
          {variant: "success"},
        );
      });
  };

  const relationship = {
    none:
      !isMe &&
      user.data &&
      (user.data.relationship === null ||
        user.data?.relationship === RELATIONSHIP_STATUS.NONE),
    friends: !isMe && user.data?.relationship === RELATIONSHIP_STATUS.FRIENDS,
    friendReqReceived:
      !isMe &&
      user.data?.relationship === RELATIONSHIP_STATUS.FRIEND_REQ_RECEIVED,
    friendReqSent:
      !isMe && user.data?.relationship === RELATIONSHIP_STATUS.FRIEND_REQ_SENT,
  };

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />

      <CommonTemplate>
        {!!user.data && <Header>{user.data!.username}</Header>}

        <Wrapper justify="space-between">
          <Profile gap={2}>
            <Layout.Row align="center" gap={2}>
              {user.data && (
                <Avatar
                  size={7}
                  src={user.data.avatar}
                  online={isOnline}
                  showStatus={!!supplemental?.status}
                />
              )}
              {hasActivity && (
                <Layout.Row align="center" gap={1}>
                  {activity}
                </Layout.Row>
              )}
            </Layout.Row>

            <Layout.Row>
              {relationship.none && (
                <Button
                  onClick={handleAddFriendButton}
                  color="primary"
                  variant="contained"
                >
                  add friend
                </Button>
              )}

              {relationship.friends && (
                <Button
                  onClick={handleUnfriendButton}
                  color="error"
                  variant="contained"
                >
                  unfriend
                </Button>
              )}

              {relationship.friendReqReceived && (
                <Button
                  onClick={handleAcceptFriendRequestButton}
                  color="primary"
                  variant="contained"
                >
                  accept friend request
                </Button>
              )}

              {relationship.friendReqSent && (
                <Button
                  onClick={handleRevokeFriendRequestButton}
                  color="info"
                  variant="contained"
                >
                  revoke friend request
                </Button>
              )}
            </Layout.Row>

            {stats.data && <ProfileStats stats={stats.data} />}
          </Profile>

          <Hub>
            {hub && (
              <ProfileHub
                friends={friends.data!}
                matches={matches.data!}
                own={false}
              />
            )}
          </Hub>
        </Wrapper>
      </CommonTemplate>
    </>
  );
};

const Wrapper = styled(Layout.Row)`
  width: 100%;
`;

const Profile = styled(Layout.Col)`
  width: 50%;
  text-align: left;
`;

const Hub = styled(Layout.Col)`
  width: 40%;
  text-align: left;
`;

const Activity = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  text-transform: lowercase;
`;

const GamepadIcon = styled(Icon.Gamepad)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};

  ${styling.mixins.pulse}
`;

const EyeIcon = styled(Icon.Eye)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};

  ${styling.mixins.pulse}
`;
