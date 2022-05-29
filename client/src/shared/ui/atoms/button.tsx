import * as React from "react";
import {
  Button as MUIButton,
  ButtonProps as MUIButtonProps,
  styled,
} from "@mui/material";

interface ButtonProps extends MUIButtonProps {}

export const Button: React.FC<ButtonProps> = ({children, ...props}) => (
  <Wrapper variant="contained" {...props}>
    {children}
  </Wrapper>
);

const Wrapper = styled(MUIButton)`
  color: #ffffff;
  font-family: "Bungee", sans-serif;
  font-weight: 400;
  font-size: 1.6rem;
  text-transform: uppercase;
  width: 20rem;
  background-color: #000000 !important;
  border-radius: 1rem;
  padding: 1.5rem 0;
`;
