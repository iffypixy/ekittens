import React from "react";
import {
  Avatar as MUIAvatar,
  css,
  styled,
  AvatarProps as MUIAvatarProps,
} from "@mui/material";

import {UserStatus} from "@entities/user";

import {styling, StylingSize} from "@shared/lib/styling";
import {isNullish} from "@shared/lib/auxiliary";

interface AvatarProps {
  size?: StylingSize;
  status?: UserStatus;
  showStatus?: boolean;
  src: string;
  variant?: MUIAvatarProps["variant"];
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  status,
  showStatus,
  size,
  src,
  className,
  variant,
}) => (
  <Wrapper size={size} className={className}>
    <Image variant={variant} src={src} alt="avatar" />
    {showStatus && <Status type={status!} />}
  </Wrapper>
);

Avatar.defaultProps = {
  variant: "circular",
};

interface WrapperStyledProps {
  size?: StylingSize;
}

const Wrapper = styled("div", {
  shouldForwardProp: (prop: string) => !["size"].includes(prop),
})<WrapperStyledProps>`
  position: relative;

  ${({size}) =>
    !isNullish(size) &&
    css`
      width: ${styling.size(size!)};
      height: ${styling.size(size!)};
    `}
`;

const Image = styled(MUIAvatar)`
  width: 100%;
  height: 100%;
  background-color: #bdbdbd;
  font-size: 2.8rem;
`;

interface StatusProps {
  type: UserStatus;
}

const status = {
  online: "#3BA45D",
  offline: "#737E8C",
};

const Status = styled("div")<StatusProps>`
  width: 25%;
  height: 25%;
  border-radius: 50%;
  position: absolute;
  bottom: 5%;
  right: 5%;
  border: 2px solid ${({theme}) => theme.palette.text.primary};
  background-color: ${({type}) => styling.prop(status[type])};
  padding: 0.5rem;
`;
