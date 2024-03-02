import React from "react";
import {styled} from "@mui/material";

interface FullscreenProps {
  children: React.ReactNode;
}

export const Fullscreen: React.FC<FullscreenProps> = ({children}) => (
  <Wrapper>{children}</Wrapper>
);

const Wrapper = styled("div")`
  width: 100%;
  height: 100vh;
  display: flex;
  overflow: hidden;
`;
