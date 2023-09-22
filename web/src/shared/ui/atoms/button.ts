import {styled, Button as MUIButton} from "@mui/material";

const disabled = "Mui-disabled";

export const Button = styled(MUIButton)`
  font-family: "Miriam Libre", sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
  width: fit-content;
  border-width: 2px !important;
  border-radius: 0.5rem;
  padding: 0.7rem 1.4rem;

  &.${disabled} svg {
    fill: ${({theme}) => theme.palette.action.disabled};
  }
`;
