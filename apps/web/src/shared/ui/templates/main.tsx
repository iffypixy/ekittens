import React from "react";
import {styled} from "@mui/material";

interface MainTemplateProps {
  children: React.ReactNode;
}

export const MainTemplate: React.FC<MainTemplateProps> = ({children}) => (
  <Wrapper>{children}</Wrapper>
);

const Wrapper = styled("div")`
  margin-left: 7.5rem;
  margin-right: 10rem;
  min-height: 100vh;
  height: 100%;
`;
