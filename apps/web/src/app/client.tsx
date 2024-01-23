import * as React from "react";

import {ViewerProfileHandler} from "@entities/viewer";
import {UserEventsHandler} from "@entities/user";
import {CredentialsObtainer} from "@features/auth";
import {MatchRejoinBoundary} from "@features/match-rejoin";
import {
  MatchmakingQueueHandler,
  MatchmakingQueueIndicator,
} from "@features/matchmaking-queue";
import {Routes} from "@pages/routes";

import {ThemingProvider} from "@shared/lib/theming";
import {NotificationProvider} from "@shared/lib/notification";

import {GlobalStyles} from "./global-styles";
import {LobbyHandler, LobbyIndicator} from "@features/lobby-rejoin";

const styles = <GlobalStyles />;

export const App: React.FC = () => (
  <ThemingProvider>
    {styles}

    <React.Suspense>
      <NotificationProvider>
        <CredentialsObtainer>
          <ViewerProfileHandler>
            <UserEventsHandler>
              <MatchmakingQueueHandler>
                <MatchmakingQueueIndicator />
                <MatchRejoinBoundary>
                  <LobbyHandler>
                    <LobbyIndicator />
                    <Routes />
                  </LobbyHandler>
                </MatchRejoinBoundary>
              </MatchmakingQueueHandler>
            </UserEventsHandler>
          </ViewerProfileHandler>
        </CredentialsObtainer>
      </NotificationProvider>
    </React.Suspense>
  </ThemingProvider>
);
