import * as React from "react";
import {ThemeProvider} from "@mui/material";
import {useSelector} from "react-redux";

import {themes} from "./themes";
import {selectors} from "./model";

export const ThemingProvider: React.FC = () => {
  const theme = useSelector(selectors.theme);

  return <ThemeProvider theme={themes[theme]}></ThemeProvider>;
};
