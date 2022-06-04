import {styled, css} from "@mui/material";

import {size} from "@shared/lib/layout";

interface TextProps {
  uppercase?: boolean;
  size?: string | number;
  secondary?: boolean;
  ellipsis?: boolean;
}

const propsNotToForward = ["uppercase", "size", "secondary"];
const shouldForwardProp = (prop: string) => !propsNotToForward.includes(prop);

export const Text = styled("span", {shouldForwardProp})<TextProps>`
  color: #000000;
  font-family: "Bungee", sans-serif;
  font-weight: 400;
  font-size: 1.6rem;

  ${({ellipsis}) =>
    ellipsis &&
    css`
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `}

  ${({uppercase}) =>
    uppercase &&
    css`
      text-transform: uppercase;
    `}

  ${(props) =>
    props.size &&
    css`
      font-size: ${size(props.size)};
    `}

  ${({secondary}) =>
    secondary &&
    css`
      color: #ffffff;
    `}
`;
