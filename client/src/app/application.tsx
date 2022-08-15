import * as React from "react";
import {SnackbarProvider} from "notistack";

import {CredentialsObtainer} from "@features/auth";
import {Routes} from "@pages/routes";
import {Boundary} from "@shared/lib/boundary";
import {GlobalStyles} from "./global-styles";
import {WsInit} from "./ws-init";
import {GlobalInit} from "./global-init";

const styles = <GlobalStyles />;

export const App: React.FC = () => (
  <>
    {styles}
    <React.Suspense>
      <CredentialsObtainer>
        <SnackbarProvider
          maxSnack={7}
          anchorOrigin={{vertical: "top", horizontal: "right"}}
          style={{
            fontFamily: "unset",
            fontSize: "1.4rem",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          <GlobalInit>
            <WsInit>
              <Boundary.RejoinMatch>
                <Routes />
              </Boundary.RejoinMatch>
            </WsInit>
          </GlobalInit>
        </SnackbarProvider>
      </CredentialsObtainer>
    </React.Suspense>
  </>
);
