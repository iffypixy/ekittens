import {darken, lighten, Palette} from "@mui/material";

const adjust = (palette: Palette) => {
  const tonalOffset = palette.tonalOffset as number;

  palette.info.light = lighten(palette.info.main, tonalOffset);

  palette.info.dark = darken(palette.info.main, tonalOffset);

  palette.info.contrastText = palette.getContrastText(palette.info.main);
};

export const palette = {adjust};
