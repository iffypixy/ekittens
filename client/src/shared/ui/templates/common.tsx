import * as React from "react";

import {MainTemplate} from "./main";
import {Container} from "./container";

interface CommonTemplateProps {
  children: React.ReactNode;
}

export const CommonTemplate: React.FC<CommonTemplateProps> = ({children}) => (
  <MainTemplate>
    <Container>{children}</Container>
  </MainTemplate>
);
