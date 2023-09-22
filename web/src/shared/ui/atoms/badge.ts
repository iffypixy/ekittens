import {darken, styled} from "@mui/material";

import {Text} from "./text";

export const Badge = styled(Text)`
  font-size: 1.2rem;
  line-height: 1.4;
  text-transform: uppercase;
  background: ${({theme}) => darken(theme.palette.background.paper, 0.1)};
  border-radius: 2px;
  padding: 0 0.5rem;
`;
