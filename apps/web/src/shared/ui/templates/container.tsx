import React from "react";
import {Container as MUIContainer} from "@mui/material";

interface ContainerProps {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({children}) => (
  <MUIContainer maxWidth="lg">{children}</MUIContainer>
);
