import {createAction} from "@reduxjs/toolkit";

import {MatchResultsStore} from "./store";

const prefix = "match-results";

export interface SetPersonalResultsPayload {
  results: MatchResultsStore["personal"];
}

export const setPersonalResults = createAction<SetPersonalResultsPayload>(
  `${prefix}/setPersonalResults`,
);

export interface SetGeneralResultsPayload {
  results: MatchResultsStore["general"];
}

export const setGeneralResults = createAction<SetGeneralResultsPayload>(
  `${prefix}/setGeneralResults`,
);
