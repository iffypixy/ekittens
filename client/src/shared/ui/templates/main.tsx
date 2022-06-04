import * as React from "react";
import {styled} from "@mui/material";

interface MainTemplateProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const MainTemplate: React.FC<MainTemplateProps> = ({
  header,
  children,
  footer,
  className,
}) => (
  <Wrapper className={className}>
    {header && <header>{header}</header>}
    <main>{children}</main>
    {footer && <footer>{footer}</footer>}
  </Wrapper>
);

const Wrapper = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;
