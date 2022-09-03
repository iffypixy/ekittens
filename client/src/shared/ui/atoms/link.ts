import {css, styled} from "@mui/material";
import {Link as RouterLink} from "react-router-dom";

interface LinkProps {
  $decorated?: boolean;
}

export const Link = styled(RouterLink)<LinkProps>`
  text-decoration: none;

  ${({$decorated}) =>
    $decorated &&
    css`
      text-decoration: underline;
    `}
`;
