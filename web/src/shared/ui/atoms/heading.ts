import {styled, css} from "@mui/material";

type Heading = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const H = (h: Heading) => styled(h)`
  ${({theme}) => css`
    color: ${theme.palette.text.primary};
    font-family: ${theme.typography[h].fontFamily};
    font-weight: ${theme.typography[h].fontWeight};
    font-size: ${theme.typography[h].fontSize};
    letter-spacing: ${theme.typography[h].letterSpacing};
    line-height: ${theme.typography[h].lineHeight};
    text-transform: uppercase;
    margin: 0;
  `};
`;

export const H1 = H("h1");
export const H2 = H("h2");
export const H3 = H("h3");
export const H4 = H("h4");
export const H5 = H("h5");
export const H6 = H("h6");
