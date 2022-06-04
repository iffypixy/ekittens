import * as React from "react";
import {styled} from "@mui/material";

interface CenterTemplateProps {
  children: React.ReactNode;
  className?: string;
}

export const CenterTemplate: React.FC<CenterTemplateProps> = ({
  children,
  className,
}) => <Wrapper className={className}>{children}</Wrapper>;

const Wrapper = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;
