import {createReducer, PayloadAction} from "@reduxjs/toolkit";

import {MODAL} from "../lib/modals";
import {MatchModal, ModalData} from "../lib/typings";
import * as actions from "./actions";

export type InGameInteractionsStore = {
  [key in MatchModal]: ModalData<any>;
};

export const store = createReducer<InGameInteractionsStore>(
  {
    [MODAL.SEE_THE_FUTURE]: {
      open: false,
      payload: null,
    },

    [MODAL.ALTER_THE_FUTURE]: {
      open: false,
      payload: null,
    },

    [MODAL.SHARE_THE_FUTURE]: {
      open: false,
      payload: null,
    },

    [MODAL.BURY_CARD]: {
      open: false,
      payload: null,
    },

    [MODAL.DEFUSE_EXPLODING_KITTEN]: {
      open: false,
      payload: null,
    },

    [MODAL.INSERT_EXPLODING_KITTEN]: {
      open: false,
      payload: null,
    },

    [MODAL.INSERT_IMPLODING_KITTEN]: {
      open: false,
      payload: null,
    },

    [MODAL.MARK_CARD]: {
      open: false,
      payload: null,
    },

    [MODAL.SELECT_PLAYER]: {
      open: false,
      payload: null,
    },

    [MODAL.SHARED_CARDS]: {
      open: false,
      payload: null,
    },
  },
  {
    [actions.setModalData.type]: (
      state,
      {payload}: PayloadAction<actions.SetModalDataPayload>,
    ) => {
      state[payload.modal] = {
        ...state[payload.modal],
        ...payload.data,
      };
    },

    [actions.resetModals.type]: (state) => {
      Object.values(MODAL).forEach((modal) => {
        state[modal] = {
          open: false,
          payload: null,
        };
      });
    },
  },
);
