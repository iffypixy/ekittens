import * as React from "react";
import {Routes as Switch, Route} from "react-router-dom";

import {HomePage} from "./home";
import {LobbyPage} from "./lobby";
import {MatchPage} from "./match";
import {InvitePage} from "./invite";

export const Routes: React.FC = () => (
  <Switch>
    <Route path="/" element={<HomePage />} />
    <Route path="/lobby" element={<LobbyPage />} />
    <Route path="/invite/:id" element={<InvitePage />} />
    <Route path="/:id" element={<MatchPage />} />
  </Switch>
);
