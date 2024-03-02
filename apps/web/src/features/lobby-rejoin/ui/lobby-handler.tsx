import React from "react";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";
import {currentLobbyModel} from "@features/current-lobby";

import {model} from "../model";

export interface LobbyHandlerProps {
  children: React.ReactNode;
}

export const LobbyHandler: React.FC<LobbyHandlerProps> = ({children}) => {
  const dispatch = useDispatch();

  const shouldCheck = useSelector(model.selectors.shouldCheck);

  React.useEffect(() => {
    if (shouldCheck) {
      dispatch(model.actions.fetchCurrentLobby())
        .unwrap()
        .then((res) => {
          dispatch(currentLobbyModel.actions.setLobby({lobby: res.lobby}));
        });
    }
  }, [shouldCheck]);

  return <>{children}</>;
};
