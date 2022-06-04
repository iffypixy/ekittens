import * as React from "react";
import {styled} from "@mui/material";

import {MainTemplate} from "@shared/ui/templates";
import {Row} from "@shared/lib/layout";

interface FullTemplateProps {
  children: React.ReactNode;
  className?: string;
}

export const FullScreenTemplate: React.FC<FullTemplateProps> = ({
  children,
  className,
}) => (
  <MainTemplate className={className}>
    <Wrapper align="center" justify="center">
      {children}
    </Wrapper>
  </MainTemplate>
);

const Wrapper = styled(Row)`
  width: 100%;
  min-height: 100vh;
  height: 100%;
`;
