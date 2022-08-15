import {css, styled} from "@mui/material";

interface StatusProps {
  online: boolean;
  size?: number;
}

const online = "#3BA45D";
const offline = "#737E8C";

export const Status = styled("div")<StatusProps>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${({online: is}) => (is ? online : offline)};
  padding: 0.5rem;

  ${({size}) =>
    size &&
    css`
      width: ${size}rem;
      height: ${size}rem;
    `}
`;
