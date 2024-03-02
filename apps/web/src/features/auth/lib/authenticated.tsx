import React from "react";
import {CircularProgress} from "@mui/material";
import {useSelector} from "react-redux";

import {viewerModel} from "@entities/viewer";

import {Credentials} from "@shared/api/common";
import {Branch} from "@shared/lib/branch";

import {model} from "../model";

type AuthenticatedRender = (options: {
  credentials: Credentials;
}) => React.ReactNode;

interface AuthenticatedProps {
  render: AuthenticatedRender;
  children: React.ReactNode;
}

export const Authenticated: React.FC<AuthenticatedProps> = ({
  render,
  children,
}) => {
  const credentials = viewerModel.useCredentials();

  const isAuthenticated = useSelector(model.selectors.isAuthenticated);
  const isFetching = useSelector(model.selectors.areCredentialsFetching);

  return (
    <Branch if={isAuthenticated}>
      <>{render({credentials})}</>

      <Branch if={isFetching}>
        <CircularProgress />
        <>{children}</>
      </Branch>
    </Branch>
  );
};
