import * as React from "react";
import {styled} from "@mui/material";

interface StyledProps {
  className?: string;
}

interface IconProps extends StyledProps {
  name: "reset";
}

export const Icon: React.FC<IconProps> = ({name, ...props}) => {
  switch (name) {
    case "reset":
      return (
        <SVG viewBox="0 0 24 24" {...props}>
          <g>
            <g>
              <path d="m21 12a9 9 0 1 1 -3.84-7.36l-.11-.32a1 1 0 0 1 1.95-.64l1 3a1 1 0 0 1 -.14.9 1 1 0 0 1 -.86.42h-3a1 1 0 0 1 -1-1 1 1 0 0 1 .71-.94 7 7 0 1 0 3.29 5.94 1 1 0 0 1 2 0z"></path>
            </g>
          </g>
        </SVG>
      );

    default:
      return null;
  }
};

const SVG = styled("svg")`
  display: block;
  width: 2rem;
  height: 2rem;
`;
