import * as React from "react";
import {
  Alert as MUIAlert,
  AlertProps,
  Slide,
  Snackbar,
  SnackbarProps,
  styled,
} from "@mui/material";

export interface NotificationProps {
  open: SnackbarProps["open"];
  severity: AlertProps["severity"];
  message: string;
  handleClose: SnackbarProps["onClose"];
}

export const Notification: React.FC<NotificationProps> = (props) => {
  const handleClose: SnackbarProps["onClose"] = (event, reason) => {
    const isClickaway = reason === "clickaway";

    const toClose = !isClickaway;

    if (!toClose) return;

    props.handleClose!(event, reason);
  };

  return (
    <Snackbar
      anchorOrigin={{vertical: "top", horizontal: "right"}}
      TransitionComponent={(props) => <Slide {...props} direction="left" />}
      autoHideDuration={5000}
      transitionDuration={500}
      open={props.open}
      onClose={handleClose}
    >
      <Alert severity={props.severity}>{props.message}</Alert>
    </Snackbar>
  );
};

const message = "MuiAlert-message";
const icon = "MuiAlert-icon";

const Alert = styled(MUIAlert)`
  width: 100%;
  align-items: center;
  padding: 1rem 2rem;

  & .${message} {
    font-size: 1.3rem;
    font-family: "Miriam Libre", sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    margin: auto;
  }

  & .${icon} {
    padding: 0;
  }
`;
