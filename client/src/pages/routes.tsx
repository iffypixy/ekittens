import * as React from "react";
import {Routes as Switch, Route} from "react-router-dom";

import {PrivateRoute, PublicOnlyRoute} from "@shared/lib/routing";
import {HomePage} from "./home";
import {LobbyPage} from "./lobby";
import {UserPage} from "./user";
import {MatchPage} from "./match";
import {SignUpPage} from "./sign-up";
import {PlayPage} from "./play";
import {SignInPage} from "./sign-in";
import {LeaderboardPage} from "./leaderboard";
import {AboutPage} from "./about";

export const Routes: React.FC = () => (
  <Switch>
    <Route path="/" element={<HomePage />} />
    <Route
      path="/@/:username"
      element={
        <PrivateRoute>
          <UserPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/lobby/:id"
      element={
        <PrivateRoute>
          <LobbyPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/login"
      element={
        <PublicOnlyRoute>
          <SignInPage />
        </PublicOnlyRoute>
      }
    />
    <Route
      path="/register"
      element={
        <PublicOnlyRoute>
          <SignUpPage />
        </PublicOnlyRoute>
      }
    />
    <Route
      path="/play"
      element={
        <PrivateRoute>
          <PlayPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/leaderboard"
      element={
        <PrivateRoute>
          <LeaderboardPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/about"
      element={
        <PrivateRoute>
          <AboutPage />
        </PrivateRoute>
      }
    />
    <Route
      path="/:id"
      element={
        <PrivateRoute>
          <MatchPage />
        </PrivateRoute>
      }
    />
  </Switch>
);
