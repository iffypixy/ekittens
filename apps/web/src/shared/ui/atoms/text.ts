import {styled} from "@mui/material";
import {
  StylingColorType,
  StylingEmphasis,
  StylingFontWeight,
  StylingSize,
  styling,
  StylingTextTransform,
} from "@shared/lib/styling";

export interface TextProps {
  color?: StylingColorType;
  emphasis?: StylingEmphasis;
  weight?: StylingFontWeight;
  size?: StylingSize;
  transform?: StylingTextTransform;
  font?: StylingEmphasis;
}

const propsToNotForward = [
  "color",
  "emphasis",
  "weight",
  "size",
  "transform",
  "font",
];

const fonts = {
  primary: "Bungee, sans-serif",
  secondary: "Miriam Libre, sans-serif",
};

export const Text = styled("span", {
  shouldForwardProp: (prop: string) => !propsToNotForward.includes(prop),
})<TextProps>`
  color: ${({theme, color, emphasis}) =>
    color ? theme.palette[color].main : theme.palette.text[emphasis!]};
  font-family: ${({font}) => fonts[font!]};
  font-weight: ${({weight}) => weight};
  font-size: ${({size}) => styling.size(size!)};
  text-transform: ${({transform}) => transform};
`;

Text.defaultProps = {
  emphasis: "primary",
  weight: 400,
  size: 1.6,
  transform: "none",
  font: "secondary",
};
