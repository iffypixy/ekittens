import React from "react";
import {useSnackbar} from "notistack";

import {userModel} from "@entities/user";
import {viewerModel} from "@entities/viewer";
import {useDispatch} from "@app/store";

import {ws} from "@shared/lib/ws";
import {userEvents} from "@shared/api/user";
import {User} from "@shared/api/common";

export interface UserEventsHandlerProps {
  children: React.ReactNode;
}

export const UserEventsHandler: React.FC<UserEventsHandlerProps> = ({
  children,
}) => {
  const dispatch = useDispatch();

  const {enqueueSnackbar} = useSnackbar();

  const handleUserOnlineEvent = React.useCallback(
    ({userId}: {userId: string}) => {
      dispatch(
        userModel.actions.setInterim({
          userId,
          interim: {status: "online"},
        }),
      );
    },
    [],
  );

  const handleUserOfflineEvent = React.useCallback(
    ({userId}: {userId: string}) => {
      dispatch(
        userModel.actions.setInterim({
          userId,
          interim: {status: "offline"},
        }),
      );
    },
    [],
  );

  const handleFriendRequestReceivedEvent = React.useCallback(
    ({user}: {user: User}) => {
      enqueueSnackbar(`${user.username} sent you a friend request`, {
        variant: "success",
      });
    },
    [],
  );

  const handleFriendRequestAcceptedEvent = React.useCallback(
    ({user}: {user: User}) => {
      enqueueSnackbar(`${user.username} accepted your friend request`, {
        variant: "success",
      });

      dispatch(viewerModel.actions.addFriend({friend: user}));
    },
    [],
  );

  const handleFriendRequestRejectedEvent = React.useCallback(
    ({user}: {user: User}) => {
      enqueueSnackbar(`${user.username} rejected your friend request`, {
        variant: "error",
      });
    },
    [],
  );

  const handleFriendRequestRevokedEvent = React.useCallback(
    ({user}: {user: User}) => {
      enqueueSnackbar(`${user.username} revoked their friend request`, {
        variant: "warning",
      });
    },
    [],
  );

  const handleUnfriendedEvent = React.useCallback(({user}: {user: User}) => {
    enqueueSnackbar(`${user.username} unfriended you`, {
      variant: "warning",
    });

    dispatch(viewerModel.actions.removeFriend({friendId: user.id}));
  }, []);

  React.useEffect(() => {
    ws.on(userEvents.client.ONLINE, handleUserOnlineEvent);
    ws.on(userEvents.client.OFFLINE, handleUserOfflineEvent);

    ws.on(
      userEvents.client.FRIEND_REQUEST_RECEIVED,
      handleFriendRequestReceivedEvent,
    );

    ws.on(
      userEvents.client.FRIEND_REQUEST_ACCEPTED,
      handleFriendRequestAcceptedEvent,
    );

    ws.on(
      userEvents.client.FRIEND_REQUEST_REJECTED,
      handleFriendRequestRejectedEvent,
    );

    ws.on(
      userEvents.client.FRIEND_REQUEST_REVOKED,
      handleFriendRequestRevokedEvent,
    );

    ws.on(userEvents.client.UNFRIENDED, handleUnfriendedEvent);

    return () => {
      ws.disable(userEvents.client.ONLINE, handleUserOnlineEvent);
      ws.disable(userEvents.client.OFFLINE, handleUserOfflineEvent);

      ws.disable(
        userEvents.client.FRIEND_REQUEST_RECEIVED,
        handleFriendRequestReceivedEvent,
      );
      ws.disable(
        userEvents.client.FRIEND_REQUEST_ACCEPTED,
        handleFriendRequestAcceptedEvent,
      );
      ws.disable(
        userEvents.client.FRIEND_REQUEST_REJECTED,
        handleFriendRequestRejectedEvent,
      );
      ws.disable(
        userEvents.client.FRIEND_REQUEST_REVOKED,
        handleFriendRequestRevokedEvent,
      );

      ws.disable(userEvents.client.UNFRIENDED, handleUnfriendedEvent);
    };
  }, []);

  return <>{children}</>;
};
