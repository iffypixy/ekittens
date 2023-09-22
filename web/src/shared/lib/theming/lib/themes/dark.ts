import {createTheme, Theme} from "@mui/material";

import {common} from "./common";

export const dark = createTheme(common, {
  palette: {
    mode: "dark",
    background: {
      default: "#000000",
      paper: "#212121",
    },
    action: {
      active: "#454545",
    },
    divider: "rgba(255, 255, 255, .25)",
    text: {
      primary: "#FFFFFF",
      secondary: "rgba(255, 255, 255, 0.5)",
    },
    info: {
      main: "#FFFFFF",
    },
  },
} as Theme);
