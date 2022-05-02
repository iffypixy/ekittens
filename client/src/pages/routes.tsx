import * as React from "react";
import {Routes as Switch, Route} from "react-router-dom";

import {MatchPage} from "./match";

export const Routes: React.FC = () => (
  <Switch>
    <Route path="/:id" element={<MatchPage />} />
  </Switch>
);
