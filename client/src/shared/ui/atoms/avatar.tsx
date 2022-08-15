import * as React from "react";
import {
  Avatar as MUIAvatar,
  AvatarProps as MUIAvatarProps,
  css,
  styled,
} from "@mui/material";

import {size} from "@shared/lib/layout";
import {Status} from "./status";

interface AvatarProps extends MUIAvatarProps {
  size?: number | string;
  online?: boolean;
  showStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  online,
  showStatus,
  ...props
}) => (
  <Wrapper>
    <AvatarImage variant="circular" {...props} />
    {showStatus && <AvatarStatus online={!!online} />}
  </Wrapper>
);

interface StyledProps {
  size?: string | number;
}

const Wrapper = styled("div")`
  position: relative;
`;

export const AvatarImage = styled(MUIAvatar)<StyledProps>`
  ${({size: s}) =>
    s &&
    css`
      width: ${size(s)};
      height: ${size(s)};
    `}
`;

const AvatarStatus = styled(Status)`
  width: 25%;
  height: 25%;
  position: absolute;
  bottom: 5%;
  right: 5%;
  border: 2px solid ${({theme}) => theme.palette.text.primary};
`;
