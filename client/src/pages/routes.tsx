import * as React from "react";
import {Route, Routes as Switch} from "react-router-dom";

import {HomePage} from "./home";

export const Routes: React.FC = () => (
  <Switch>
    <Route path="/" element={<HomePage />} />
  </Switch>
);
