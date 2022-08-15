import {styled} from "@mui/material";

export interface TextProps {
  color?: "primary" | "secondary";
}

const propsToNotForward = ["color"];

export const Text = styled("span", {
  shouldForwardProp: (prop: string) => !propsToNotForward.includes(prop),
})<TextProps>`
  color: ${({theme, color}) => theme.palette.text[color!]};
  font-size: 1.6rem;
  font-weight: 400;
`;

Text.defaultProps = {
  color: "primary",
};
