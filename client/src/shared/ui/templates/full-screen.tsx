import * as React from "react";
import {styled} from "@mui/material";

interface FullTemplateProps {
  children: React.ReactNode;
}

export const FullScreenTemplate: React.FC<FullTemplateProps> = ({children}) => (
  <Wrapper>{children}</Wrapper>
);

const Wrapper = styled("div")`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;
