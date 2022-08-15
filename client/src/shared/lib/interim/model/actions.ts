import {createAction, createAsyncThunk} from "@reduxjs/toolkit";
import {
  GetUserSupplementalData,
  GetUserSupplementalResponse,
  userApi,
} from "@shared/api/user";
import {UserSupplemental} from "@shared/api/common";

const prefix = "interim";

export interface SetUserSupplemental {
  id: string;
  supplemental: Partial<UserSupplemental>;
}

export const setUserSupplemental = createAction<SetUserSupplemental>(
  `${prefix}/setUserSupplemental`,
);

export type FetchUserSupplementalPayload = GetUserSupplementalResponse;

export const fetchUserSupplemental = createAsyncThunk<
  FetchUserSupplementalPayload,
  GetUserSupplementalData
>(`${prefix}/fetchUserSupplemental`, async (options) => {
  const data = await userApi.getSupplemental(options);

  return data;
});
