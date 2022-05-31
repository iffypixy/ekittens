import {
  styled,
  css,
  Avatar as MUIAvatar,
  AvatarProps as MUIAvatarProps,
} from "@mui/material";

import {size} from "@shared/lib/layout";

export interface AvatarProps extends MUIAvatarProps {
  size?: number | string;
}

export const Avatar = styled(MUIAvatar)<AvatarProps>`
  ${(props) =>
    props.size &&
    css`
      width: ${size(props.size)};
      height: ${size(props.size)};
    `}
`;
