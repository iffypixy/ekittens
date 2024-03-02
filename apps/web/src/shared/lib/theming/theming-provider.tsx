import React from "react";
import {ThemeProvider} from "@mui/material";
import {useSelector} from "react-redux";

import {themes} from "./lib/themes";
import {palette} from "./lib/palette";
import {model} from "./model";

interface ThemingProviderProps {
  children: React.ReactNode;
}

export const ThemingProvider: React.FC<ThemingProviderProps> = ({children}) => {
  const current = useSelector(model.selectors.theme);

  const theme = themes[current];

  palette.adjust(theme.palette);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};
