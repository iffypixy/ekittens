import React from "react";
import {styled} from "@mui/material";

interface CenterProps {
  children: React.ReactNode;
}

export const Center: React.FC<CenterProps> = ({children}) => (
  <Wrapper>{children}</Wrapper>
);

const Wrapper = styled("div")`
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;
