import React from "react";
import {keyframes, styled} from "@mui/material";

export const Spinner: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <SVG viewBox="22 22 44 44" {...props}>
    <Circle cx="44" cy="44" r="20.2" stroke-width="3.6" />
  </SVG>
);

const SVG = styled("svg")`
  display: block;
  fill: none;
`;

const spin = keyframes`
  0% {
      stroke-dasharray: 0.1rem, 20rem;
      stroke-dashoffset: 0;
  }

  50% {
      stroke-dasharray: 10rem, 20rem;
      stroke-dashoffset: -1.5rem;
  }

  100% {
      stroke-dasharray: 10rem, 20rem;
      stroke-dashoffset: -12.5rem;
  }
`;

const Circle = styled("circle")`
  fill: none;
  stroke: currentcolor;
  stroke-dasharray: 8rem, 20rem;
  stroke-dashoffset: 0;
  animation: 1s ease-in-out 0s infinite normal none running ${spin};
`;
