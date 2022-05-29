import * as React from "react";
import {styled} from "@mui/material";

interface StyledProps {
  className?: string;
}

interface IconProps extends StyledProps {
  name: "reset" | "crown";
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

    case "crown":
      return (
        <SVG viewBox="0 0 32 32" {...props}>
          <g>
            <path d="m27.488 23-.513 2.225c-.105.454-.509.775-.975.775h-20c-.466 0-.87-.321-.975-.775l-.513-2.225z"></path>
            <path d="m29.975 12.225-2.025 8.775h-23.9l-2.025-8.775c-.089-.387.059-.791.378-1.028.32-.237.749-.262 1.093-.065l6.189 3.537 5.482-8.223c.179-.268.475-.434.796-.446.324-.014.629.132.826.386l6.429 8.266 5.227-3.484c.341-.226.786-.224 1.123.009.338.233.498.649.407 1.048z"></path>
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
`;
