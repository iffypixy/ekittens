import {css} from "@mui/material";

const pulse = css`
  animation: pulsate 1.5s forwards;
  animation-iteration-count: infinite;
  animation-duration: 1s;

  @keyframes pulsate {
    0% {
      transform: scale(1);
    }

    30% {
      transform: scale(1.15);
    }

    100% {
      transform: scale(0.85);
    }
  }
`;

export const mixins = {pulse};
