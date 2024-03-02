import React from "react";
import {useSelector} from "react-redux";
import {useSnackbar} from "notistack";
import {useNavigate} from "react-router-dom";

import {useDispatch} from "@app/store";

import {
  ParticipantJoinEventOptions,
  ParticipantLeaveEventOptions,
  LeaderSwitchEventOptions,
  DisabledCardsUpdateEventOptions,
  matchEvents,
} from "@shared/api/match";

import * as selectors from "./selectors";
import * as actions from "./actions";
import {model} from "../model";
import {currentLobbyModel} from "..";

export const useLobby = () => useSelector(selectors.lobby);

export const useWsHandlers = () => {
  const dispatch = useDispatch();

  const {enqueueSnackbar} = useSnackbar();

  const navigate = useNavigate();

  const handleParticipantJoinEvent = React.useCallback(
    ({participant}: ParticipantJoinEventOptions) => {
      dispatch(actions.addParticipant({participant}));

      enqueueSnackbar(`${participant.username} joined the lobby`, {
        variant: "success",
      });
    },
    [],
  );

  const handleParticipantLeaveEvent = React.useCallback(
    ({participant}: ParticipantLeaveEventOptions) => {
      dispatch(actions.removeParticipant({participantId: participant.id}));

      enqueueSnackbar(`${participant.username} left the lobby`, {
        variant: "error",
      });
    },
    [],
  );

  const handleLeaderSwitchEvent = React.useCallback(
    ({participant}: LeaderSwitchEventOptions) => {
      dispatch(
        actions.setParticipantRole({
          participantId: participant.id,
          role: "leader",
        }),
      );

      enqueueSnackbar(`${participant.username} is now the leader`, {
        variant: "info",
      });
    },
    [],
  );

  const handleDisabledCardsUpdateEvent = React.useCallback(
    ({disabled}: DisabledCardsUpdateEventOptions) => {
      dispatch(actions.setDisabledCards({cards: disabled}));
    },
    [],
  );

  const handleModeChangeEvent = React.useCallback(({mode}) => {
    dispatch(actions.setMode({mode}));
  }, []);

  const handleParticipantKickedEvent = React.useCallback(({participant}) => {
    dispatch(
      model.actions.removeParticipant({
        participantId: participant.id,
      }),
    );

    enqueueSnackbar(`${participant.username} has been kicked by the leader`, {
      variant: "error",
    });
  }, []);

  const handleSelfParticipantKickedEvent = React.useCallback(() => {
    dispatch(currentLobbyModel.actions.setLobby({lobby: null}));

    enqueueSnackbar("You have been kicked by the leader", {variant: "error"});

    navigate("/");
  }, []);

  const handlers = {
    [matchEvents.client.PARTICIPANT_JOIN]: handleParticipantJoinEvent,
    [matchEvents.client.PARTICIPANT_LEAVE]: handleParticipantLeaveEvent,
    [matchEvents.client.LEADER_SWITCH]: handleLeaderSwitchEvent,
    [matchEvents.client.DISABLED_UPDATE]: handleDisabledCardsUpdateEvent,
    [matchEvents.client.MODE_CHANGE]: handleModeChangeEvent,
    [matchEvents.client.PARTICIPANT_KICKED]: handleParticipantKickedEvent,
    [matchEvents.client.SELF_PARTICIPANT_KICKED]:
      handleSelfParticipantKickedEvent,
  };

  return {handlers};
};
