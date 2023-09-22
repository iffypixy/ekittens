import {styled, Tabs as MUITabs, Tab as MUITab} from "@mui/material";

const indicator = "MuiTabs-indicator";

export const Tabs = styled(MUITabs)`
  width: fit-content;
  min-height: initial;
  background-color: ${({theme}) => theme.palette.background.paper};
  border-radius: 0.5rem;
  border: 1px solid ${({theme}) => theme.palette.divider};

  & .${indicator} {
    display: none;
  }
`;

const selected = "Mui-selected";

export const Tab = styled(MUITab)`
  color: ${({theme}) => theme.palette.text.primary};
  font-family: "Miriam Libre", sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  min-width: initial;
  max-width: initial;
  min-height: initial;
  padding: 0.7rem 1.3rem;

  &.${selected} {
    color: ${({theme}) => theme.palette.text.primary};
    background-color: ${({theme}) => theme.palette.action.active};
  }
`;
