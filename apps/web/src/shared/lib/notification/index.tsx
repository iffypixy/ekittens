import React from "react";
import {SnackbarProvider} from "notistack";

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => (
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
    {children}
  </SnackbarProvider>
);
