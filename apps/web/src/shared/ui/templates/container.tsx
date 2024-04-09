import React from "react";
import {Container as MUIContainer, styled} from "@mui/material";

interface ContainerProps {
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({children}) => (
  <Wrapper maxWidth="xl">{children}</Wrapper>
);

const Wrapper = styled(MUIContainer)`
  width: 90%;
  margin: 0 auto;
`;
