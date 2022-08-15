import * as React from "react";
import {useSelector} from "react-redux";

import {authModel} from "@features/auth";
import {HomeAuthenticated} from "./authenticated";
import {HomeGuest} from "./guest";

export const HomePage: React.FC = () => {
  const isAuthenticated = useSelector(authModel.selectors.isAuthenticated);

  if (isAuthenticated) return <HomeAuthenticated />;

  return <HomeGuest />;
};
