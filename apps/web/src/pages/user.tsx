import React from "react";
import {styled} from "@mui/material";
import {useParams} from "react-router-dom";
import {useSelector} from "react-redux";
import {useSnackbar} from "notistack";

import {
  userModel,
  UserActivity,
  UserHub,
  UserStats,
  RELATIONSHIP_STATUS,
} from "@entities/user";
import {viewerModel} from "@entities/viewer";
import {Header, Sidebar} from "@widgets/sidebar";
import {store, useDispatch} from "@app/store";

import {CommonTemplate} from "@shared/ui/templates";
import {Avatar, Button} from "@shared/ui/atoms";
import {Layout} from "@shared/lib/layout";
import {User, UserWithRelationship} from "@shared/api/common";
import {userEvents} from "@shared/api/user";
import {ws} from "@shared/lib/ws";

interface UserPageParams {
  username: string;
}

export const UserPage: React.FC = () => {
  const dispatch = useDispatch();

  const {username} = useParams<Partial<UserPageParams>>() as UserPageParams;

  const {enqueueSnackbar} = useSnackbar();

  const credentials = viewerModel.useCredentials();

  const interims = userModel.useInterims();

  const isViewer =
    credentials.username.toLowerCase() === username.toLowerCase();

  const userSelector = isViewer
    ? viewerModel.selectors.profile
    : userModel.selectors.user;

  const statsSelector = isViewer
    ? viewerModel.selectors.stats
    : userModel.selectors.stats;

  const matchesSelector = isViewer
    ? viewerModel.selectors.matches
    : userModel.selectors.matches;

  const friendsSelector = isViewer
    ? viewerModel.selectors.friends
    : userModel.selectors.friends;

  const user = useSelector(userSelector);
  const stats = useSelector(statsSelector);
  const matches = useSelector(matchesSelector);
  const friends = useSelector(friendsSelector);

  const handleFriendRequestReceivedEvent = React.useCallback(
    ({user}: {user: User}) => {
      const state = store.getState();

      const isUser = state.user.user.data?.id === user.id;

      if (isUser) {
        dispatch(
          userModel.actions.setRelationship({
            relationship: RELATIONSHIP_STATUS.FRIEND_REQ_RECEIVED,
          }),
        );
      }
    },
    [],
  );

  const handleFriendRequestAcceptedEvent = React.useCallback(
    ({user}: {user: User}) => {
      const state = store.getState();

      const isUser = state.user.user.data?.id === user.id;

      if (isUser) {
        dispatch(
          userModel.actions.setRelationship({
            relationship: RELATIONSHIP_STATUS.FRIENDS,
          }),
        );
      }
    },
    [],
  );

  const handleFriendRequestRejectedEvent = React.useCallback(
    ({user}: {user: User}) => {
      const state = store.getState();

      const isUser = state.user.user.data?.id === user.id;

      if (isUser) {
        dispatch(
          userModel.actions.setRelationship({
            relationship: RELATIONSHIP_STATUS.NONE,
          }),
        );
      }
    },
    [],
  );

  const handleFriendRequestRevokedEvent = React.useCallback(
    ({user}: {user: User}) => {
      const state = store.getState();

      const isUser = state.user.user.data?.id === user.id;

      if (isUser) {
        dispatch(
          userModel.actions.setRelationship({
            relationship: RELATIONSHIP_STATUS.NONE,
          }),
        );
      }
    },
    [],
  );

  const handleUnfriendedEvent = React.useCallback(({user}: {user: User}) => {
    const state = store.getState();

    const isUser = state.user.user.data?.id === user.id;

    if (isUser) {
      dispatch(
        userModel.actions.setRelationship({
          relationship: RELATIONSHIP_STATUS.NONE,
        }),
      );
    }
  }, []);

  React.useEffect(() => {
    if (isViewer) {
      dispatch(viewerModel.actions.fetchProfile());
      dispatch(viewerModel.actions.fetchFriends())
        .unwrap()
        .then((res) => {
          const ids = res.friends.map((friend) => friend.id);

          dispatch(userModel.actions.fetchInterim({ids}));
        });
      dispatch(viewerModel.actions.fetchStats());
      dispatch(viewerModel.actions.fetchMatches());
    } else {
      dispatch(userModel.actions.fetchUser({username}))
        .unwrap()
        .then((res) => {
          const ids = [res.user.id];

          dispatch(userModel.actions.fetchInterim({ids}));
        });

      dispatch(userModel.actions.fetchFriends({username}))
        .unwrap()
        .then((res) => {
          const ids = res.friends.map((friend) => friend.id);

          dispatch(userModel.actions.fetchInterim({ids}));
        });

      dispatch(userModel.actions.fetchStats({username}));
      dispatch(userModel.actions.fetchMatches({username}));
    }
  }, [username]);

  React.useEffect(() => {
    const handlers = {
      [userEvents.client.FRIEND_REQUEST_RECEIVED]:
        handleFriendRequestReceivedEvent,
      [userEvents.client.FRIEND_REQUEST_ACCEPTED]:
        handleFriendRequestAcceptedEvent,
      [userEvents.client.FRIEND_REQUEST_REJECTED]:
        handleFriendRequestRejectedEvent,
      [userEvents.client.FRIEND_REQUEST_REVOKED]:
        handleFriendRequestRevokedEvent,
      [userEvents.client.UNFRIENDED]: handleUnfriendedEvent,
    };

    Object.keys(handlers).forEach((event) => {
      ws.on(event, handlers[event]);
    });

    return () => {
      Object.keys(handlers).forEach((event) => {
        ws.disable(event, handlers[event]);
      });
    };
  }, []);

  const interim = user.data && interims[user.data.id];

  const activity = interim?.activity;
  const status = interim?.status;

  const handleAddFriendButton = () => {
    dispatch(userModel.actions.sendFriendRequest({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(userModel.actions.setRelationship({relationship: res.status}));
        enqueueSnackbar(
          `You successfully sent a friend request to ${user.data?.username}`,
          {variant: "success"},
        );
      });
  };

  const handleUnfriendButton = () => {
    dispatch(userModel.actions.unfriendFriend({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(viewerModel.actions.removeFriend({friendId: user.data!.id}));

        dispatch(userModel.actions.setRelationship({relationship: res.status}));

        enqueueSnackbar(`You successfully unfriended ${user.data?.username}`, {
          variant: "success",
        });
      });
  };

  const handleAcceptFriendRequestButton = () => {
    dispatch(userModel.actions.acceptFriendRequest({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(userModel.actions.setRelationship({relationship: res.status}));
        dispatch(viewerModel.actions.addFriend({friend: user.data!}));

        enqueueSnackbar(
          `You successfully accepted friend request from ${user.data?.username}`,
          {variant: "success"},
        );
      });
  };

  const handleRevokeFriendRequestButton = () => {
    dispatch(userModel.actions.revokeFriendRequest({userId: user.data!.id}))
      .unwrap()
      .then((res) => {
        dispatch(userModel.actions.setRelationship({relationship: res.status}));

        enqueueSnackbar(
          `You successfully revoked your friend request to ${user.data?.username}`,
          {variant: "success"},
        );
      });
  };

  const relationship = !isViewer
    ? {
        none:
          user.data &&
          ((user.data as UserWithRelationship).relationship === null ||
            (user.data as UserWithRelationship).relationship ===
              RELATIONSHIP_STATUS.NONE),
        friends:
          user.data &&
          (user.data as UserWithRelationship).relationship ===
            RELATIONSHIP_STATUS.FRIENDS,
        friendReqReceived:
          user.data &&
          (user.data as UserWithRelationship).relationship ===
            RELATIONSHIP_STATUS.FRIEND_REQ_RECEIVED,
        friendReqSent:
          user.data &&
          (user.data as UserWithRelationship).relationship ===
            RELATIONSHIP_STATUS.FRIEND_REQ_SENT,
      }
    : null;

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />

      <CommonTemplate>
        {user.data && <Header>{user.data.username}</Header>}

        <Wrapper justify="space-between">
          <Profile gap={2}>
            <Layout.Row align="center" gap={2}>
              {user.data && (
                <Avatar
                  size={7}
                  src={user.data.avatar}
                  status={status}
                  showStatus={!!status}
                />
              )}

              {activity && <UserActivity type={activity.type} />}
            </Layout.Row>

            {!isViewer && (
              <Layout.Row>
                {relationship!.none && (
                  <Button
                    onClick={handleAddFriendButton}
                    color="primary"
                    variant="contained"
                  >
                    add friend
                  </Button>
                )}

                {relationship!.friends && (
                  <Button
                    onClick={handleUnfriendButton}
                    color="error"
                    variant="contained"
                  >
                    unfriend
                  </Button>
                )}

                {relationship!.friendReqReceived && (
                  <Button
                    onClick={handleAcceptFriendRequestButton}
                    color="primary"
                    variant="contained"
                  >
                    accept friend request
                  </Button>
                )}

                {relationship!.friendReqSent && (
                  <Button
                    onClick={handleRevokeFriendRequestButton}
                    color="info"
                    variant="contained"
                  >
                    revoke friend request
                  </Button>
                )}
              </Layout.Row>
            )}

            {stats.data && <UserStats stats={stats.data} />}
          </Profile>

          <Hub>
            <UserHub
              friends={friends.data}
              matches={matches.data}
              isOwn={isViewer}
            />
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
