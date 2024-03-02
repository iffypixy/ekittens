import React from "react";
import {styled} from "@mui/material";

import {Layout} from "@shared/lib/layout";

const List = styled(Layout.Col)`
  width: 25rem;
  border: 0.5rem solid ${({theme}) => theme.palette.divider};
  overflow: hidden;
`;

interface ActionsListItemProps
  extends Omit<React.HTMLProps<HTMLDivElement>, "as"> {
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Item: React.FC<ActionsListItemProps> = ({icon, children, ...props}) => (
  <Action gap={1.5} {...props}>
    {icon} {children}
  </Action>
);

const Action = styled(Layout.Row)`
  background-color: ${({theme}) => theme.palette.background.default};
  align-items: center;
  text-transform: uppercase;
  cursor: pointer;
  padding: 1rem 2rem;

  &:hover {
    color: ${({theme}) => theme.palette.background.default} !important;
    background-color: ${({theme}) => theme.palette.text.primary};
  }
`;

export const Actions = {List, Item};
