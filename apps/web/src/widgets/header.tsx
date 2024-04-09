import React from "react";
import {styled} from "@mui/material";

import {H1} from "@shared/ui/atoms";

export interface HeaderProps {
  children: string;
}

export const Header: React.FC<HeaderProps> = ({children}) => (
  <Wrapper>
    <Title>{children}</Title>
  </Wrapper>
);

const Wrapper = styled("div")`
  width: fit-content;
  border-bottom: 2px dotted ${({theme}) => theme.palette.divider};
  padding-bottom: 1rem;
  margin-bottom: 10rem;
`;

const Title = styled(H1)`
  max-width: 65rem;
  width: fit-content;
  color: ${({theme}) => theme.palette.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
`;
