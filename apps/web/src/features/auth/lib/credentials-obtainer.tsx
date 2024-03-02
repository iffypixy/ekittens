import React from "react";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";
import {viewerModel} from "@entities/viewer";

import {model} from "../model";

export interface CredentialsObtainerProps {
  children: React.ReactNode;
}

export const CredentialsObtainer: React.FC<CredentialsObtainerProps> = ({
  children,
}) => {
  const dispatch = useDispatch();

  const credentials = viewerModel.useCredentials();

  const isFetching = useSelector(model.selectors.areCredentialsFetching);

  React.useEffect(() => {
    if (!credentials) {
      dispatch(model.actions.setAreCredentialsFetching({areFetching: true}));

      dispatch(model.actions.fetchCredentials())
        .unwrap()
        .then((res) => {
          dispatch(
            viewerModel.actions.setCredentials({credentials: res.credentials}),
          );
        })
        .finally(() => {
          dispatch(
            model.actions.setAreCredentialsFetching({areFetching: false}),
          );
        });
    }
  }, []);

  if (isFetching) return null;

  return <>{children}</>;
};
