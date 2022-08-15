import * as React from "react";
import {useSnackbar} from "notistack";

import {socket} from "@shared/lib/ws";
import {interimModel} from "@shared/lib/interim";
import {userEvents} from "@shared/api/user";
import {User} from "@shared/api/common";
import {store, useDispatch} from "./store";
import {profileModel, RELATIONSHIP_STATUS} from "@entities/profile";
import {userModel} from "@entities/user";

export interface WsInitProps {
  children: React.ReactNode;
}

export const WsInit: React.FC<WsInitProps> = ({children}) => {
  const dispatch = useDispatch();

  const {enqueueSnackbar} = useSnackbar();

  React.useEffect(() => {
    socket.on(userEvents.client.ONLINE, ({userId}) => {
      dispatch(
        interimModel.actions.setUserSupplemental({
          id: userId,
          supplemental: {status: "online"},
        }),
      );
    });

    socket.on(userEvents.client.OFFLINE, ({userId}) => {
      dispatch(
        interimModel.actions.setUserSupplemental({
          id: userId,
          supplemental: {status: "offline"},
        }),
      );
    });

    socket.on(
      userEvents.client.FRIEND_REQUEST_RECEIVED,
      ({user}: {user: User}) => {
        enqueueSnackbar(`${user.username} sent you a friend request`, {
          variant: "success",
        });

        const isCurrent = store.getState().profile.user.data?.id === user.id;

        if (isCurrent)
          dispatch(
            profileModel.actions.setRelationship(
              RELATIONSHIP_STATUS.FRIEND_REQ_RECEIVED,
            ),
          );
      },
    );

    socket.on(
      userEvents.client.FRIEND_REQUEST_ACCEPTED,
      ({user}: {user: User}) => {
        enqueueSnackbar(`${user.username} accepted your friend request`, {
          variant: "success",
        });

        dispatch(userModel.actions.addFriend(user));

        const isCurrent = store.getState().profile.user.data?.id === user.id;

        if (isCurrent)
          dispatch(
            profileModel.actions.setRelationship(RELATIONSHIP_STATUS.FRIENDS),
          );
      },
    );

    socket.on(
      userEvents.client.FRIEND_REQUEST_REJECTED,
      ({user}: {user: User}) => {
        enqueueSnackbar(`${user.username} rejected your friend request`, {
          variant: "error",
        });

        const isCurrent = store.getState().profile.user.data?.id === user.id;

        if (isCurrent)
          dispatch(
            profileModel.actions.setRelationship(RELATIONSHIP_STATUS.NONE),
          );
      },
    );

    socket.on(
      userEvents.client.FRIEND_REQUEST_REVOKED,
      ({user}: {user: User}) => {
        enqueueSnackbar(`${user.username} revoked their friend request`, {
          variant: "warning",
        });

        const isCurrent = store.getState().profile.user.data?.id === user.id;

        if (isCurrent)
          dispatch(
            profileModel.actions.setRelationship(RELATIONSHIP_STATUS.NONE),
          );
      },
    );

    socket.on(userEvents.client.UNFRIENDED, ({user}: {user: User}) => {
      enqueueSnackbar(`${user.username} unfriended you`, {
        variant: "warning",
      });

      dispatch(userModel.actions.removeFriend({id: user.id}));

      const isCurrent = store.getState().profile.user.data?.id === user.id;

      if (isCurrent)
        dispatch(
          profileModel.actions.setRelationship(RELATIONSHIP_STATUS.NONE),
        );
    });

    return () => {
      socket.off(userEvents.client.ONLINE);
      socket.off(userEvents.client.OFFLINE);
    };
  }, []);

  return <>{children}</>;
};
