import React from "react";
import {useNavigate} from "react-router-dom";

import {useDispatch} from "@app/store";
import {currentMatchModel} from "@features/current-match";
import {currentLobbyModel} from "@features/current-lobby";

import {ws} from "@shared/lib/ws";
import {matchEvents, MatchStartEventOptions} from "@shared/api/match";

import {model} from "../model";

interface MatchmakingQueueHandlerProps {
  children: React.ReactNode;
}

export const MatchmakingQueueHandler: React.FC<
  MatchmakingQueueHandlerProps
> = ({children}) => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  React.useEffect(() => {
    dispatch(model.actions.fetchQueueStatus());
  }, []);

  const handleMatchStartEvent = React.useCallback(
    ({match}: MatchStartEventOptions) => {
      dispatch(currentMatchModel.actions.setMatch({match}));
      dispatch(currentLobbyModel.actions.setLobby({lobby: null}));

      dispatch(model.actions.setIsEnqueued({isEnqueued: false}));
      dispatch(model.actions.setEnqueuedAt({enqueuedAt: null}));

      navigate(`/${match.id}`);
    },
    [],
  );

  React.useEffect(() => {
    ws.on(matchEvents.client.MATCH_START, handleMatchStartEvent);

    return () => {
      ws.disable(matchEvents.client.MATCH_START, handleMatchStartEvent);
    };
  }, []);

  return <>{children}</>;
};
