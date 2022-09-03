import {styled, Modal as MUIModal} from "@mui/material";

const backdrop = "MuiBackdrop-root";

export const Modal = styled(MUIModal)`
  .${backdrop} {
    background-color: rgba(25, 0, 0, 0.9);
  }
`;

export interface ModalProps {
  open: boolean;
  handleClose: () => void;
}
