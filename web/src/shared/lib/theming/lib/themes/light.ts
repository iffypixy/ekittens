import {createTheme, Theme} from "@mui/material";

import {common} from "./common";

export const light = createTheme(common, {
  palette: {
    mode: "light",
    background: {
      default: "#FFFFFF",
      paper: "#FAFAFA",
    },
    action: {
      active: "#D2D2D2",
    },
    divider: "rgba(0, 0, 0, .1)",
    text: {
      primary: "#000000",
      secondary: "rgba(0, 0, 0, 0.5)",
    },
    info: {
      main: "#000000",
    },
  },
} as Theme);
