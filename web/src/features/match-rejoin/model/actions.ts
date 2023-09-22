import {createAction} from "@reduxjs/toolkit";

const prefix = "match-rejoin";

export interface SetShouldCheckPayload {
  shouldCheck: boolean;
}

export const setShouldCheck = createAction<SetShouldCheckPayload>(
  `${prefix}/setShouldCheck`,
);
