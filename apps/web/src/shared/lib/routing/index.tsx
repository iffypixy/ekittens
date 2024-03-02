import React from "react";
import {Navigate} from "react-router-dom";
import {useSelector} from "react-redux";

import {authModel} from "@features/auth";

interface CustomRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<CustomRouteProps> = ({children}) => {
  const isAuthenticated = useSelector(authModel.selectors.isAuthenticated);

  if (isAuthenticated) return <>{children}</>;

  return <Navigate to="/login" />;
};

export const PublicOnlyRoute: React.FC<CustomRouteProps> = ({children}) => {
  const isAuthenticated = useSelector(authModel.selectors.isAuthenticated);

  if (!isAuthenticated) return <>{children}</>;

  return <Navigate to="/" />;
};
