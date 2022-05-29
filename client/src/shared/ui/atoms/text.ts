import {styled, css} from "@mui/material";

interface TextProps {
  uppercase?: boolean;
}

const propsNotToForward = ["uppercase"];
const shouldForwardProp = (prop: string) => !propsNotToForward.includes(prop);

export const Text = styled("span", {shouldForwardProp})<TextProps>`
  color: #000000;
  font-family: "Bungee", sans-serif;
  font-weight: 400;
  font-size: 1.6rem;

  ${({uppercase}) =>
    uppercase &&
    css`
      text-transform: uppercase;
    `}
`;
