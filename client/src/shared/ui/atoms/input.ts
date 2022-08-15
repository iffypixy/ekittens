import {
  styled,
  InputBase,
  InputLabel,
  alpha,
  FormHelperText,
  FormControl as MUIFormControl,
} from "@mui/material";

const input = "MuiInputBase-input";
const error = "Mui-error";

export const FormControl = styled(MUIFormControl)``;

export const Input = styled(InputBase)`
  margin: 0.25rem 0;

  &.${error} {
    & .${input} {
      border-color: ${({theme}) => alpha(theme.palette.error.main, 0.25)};

      &:hover {
        border-color: ${({theme}) => theme.palette.error.main};
      }

      &:focus {
        border-color: ${({theme}) => theme.palette.error.main};
        box-shadow: ${({theme}) =>
          `${alpha(theme.palette.error.main, 0.25)} 0 0 0 0.2rem`};
      }
    }
  }

  & .${input} {
    color: ${({theme}) => theme.palette.text.primary};
    font-family: "Miriam Libre", sans-serif;
    font-size: 1.4rem;
    height: initial;
    position: relative;
    transition: 0.2s linear;
    border: 2px solid ${({theme}) => alpha(theme.palette.text.primary, 0.25)};
    border-radius: 0.5rem;
    padding: 1rem 1.5rem;

    &:hover {
      border-color: ${({theme}) => theme.palette.text.primary};
    }

    &:focus {
      border-color: ${({theme}) => theme.palette.primary.main};
      box-shadow: ${({theme}) =>
        `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`};
    }
  }
`;

export const Label = styled(InputLabel)`
  color: ${({theme}) => theme.palette.text.primary};
  font-family: "Miriam Libre", sans-serif;
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
  position: relative;
  transform: none;
`;

export const InputHelper = styled(FormHelperText)`
  font-size: 1rem;
  font-family: "Miriam Libre", sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  margin: 0;
`;
