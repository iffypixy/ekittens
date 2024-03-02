import React from "react";
import {authModel} from "@features/auth";

import {useDispatch} from "@app/store";
import {userModel} from "@entities/user";
import {currentMatchModel} from "@features/current-match";

import {model} from "../model";
import {useSelector} from "react-redux";

interface ViewerProfileHandlerProps {
  children: React.ReactNode;
}

export const ViewerProfileHandler: React.FC<ViewerProfileHandlerProps> = ({
  children,
}) => {
  const dispatch = useDispatch();

  const match = currentMatchModel.useMatch();

  const isAuthenticated = useSelector(authModel.selectors.isAuthenticated);

  React.useEffect(() => {
    dispatch(model.actions.fetchFriends())
      .unwrap()
      .then((res) => {
        const ids = res.friends.map((friend) => friend.id);

        dispatch(userModel.actions.fetchInterim({ids}));
      });
  }, [isAuthenticated]);

  React.useEffect(() => {
    dispatch(model.actions.fetchMatches());
    dispatch(model.actions.fetchStats());
  }, [match, isAuthenticated]);

  return <>{children}</>;
};
