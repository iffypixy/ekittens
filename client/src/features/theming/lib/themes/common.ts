import {createTheme} from "@mui/material";

export const common = createTheme({
  palette: {
    primary: {
      main: "#00A800",
    },
    secondary: {
      main: "#FFDD00",
    },
    success: {
      main: "#00A800",
    },
    error: {
      main: "#F20601",
    },
  },
  typography: {
    h1: {
      fontFamily: '"Bungee", sans-serif',
      fontWeight: 400,
      fontSize: "4rem",
    },
    h2: {
      fontFamily: '"Bungee", sans-serif',
      fontWeight: 400,
      fontSize: "3.4rem",
    },
    h3: {
      fontFamily: '"Bungee", sans-serif',
      fontWeight: 400,
      fontSize: "2.8rem",
    },
    h4: {
      fontFamily: '"Bungee", sans-serif',
      fontWeight: 400,
      fontSize: "2.4rem",
    },
    h5: {
      fontFamily: '"Bungee", sans-serif',
      fontWeight: 400,
      fontSize: "2rem",
    },
    h6: {
      fontFamily: '"Bungee", sans-serif',
      fontWeight: 400,
      fontSize: "1.6rem",
    },
  },
});
