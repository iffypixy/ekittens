import * as React from "react";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";
import {model} from "../model";

export interface CredentialsObtainerProps {
  children: React.ReactNode;
}

export const CredentialsObtainer: React.FC<CredentialsObtainerProps> = ({
  children,
}) => {
  const dispatch = useDispatch();

  const credentials = useSelector(model.selectors.credentials);
  const isFetching = useSelector(model.selectors.areCredentialsFetching);

  React.useEffect(() => {
    if (!credentials) dispatch(model.actions.fetchCredentials());
  }, []);

  if (isFetching) return null;

  return <>{children}</>;
};
