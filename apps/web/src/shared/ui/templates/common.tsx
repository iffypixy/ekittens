import React from "react";
import {styled} from "@mui/material";

import {MainTemplate} from "./main";
import {Container} from "./container";

interface CommonTemplateProps {
  children: React.ReactNode;
}

export const CommonTemplate: React.FC<CommonTemplateProps> = ({children}) => (
  <MainTemplate>
    <Container>
      <Inner>{children}</Inner>
    </Container>
  </MainTemplate>
);

const Inner = styled("div")`
  padding: 8% 0;
`;
