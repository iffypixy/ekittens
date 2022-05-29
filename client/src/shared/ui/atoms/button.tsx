import * as React from "react";
import {ButtonBase, styled} from "@mui/material";

interface ButtonProps {
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({children}) => (
  <Wrapper>{children}</Wrapper>
);

const Wrapper = styled(ButtonBase)`
  width: 20rem;
  color: #ffffff;
  background-color: #000000;
  border-radius: 1rem;
  padding: 1.5rem 0;
`;
