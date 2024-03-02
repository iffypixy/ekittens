import React from "react";
import {styled} from "@mui/material";

import {ActivityType} from "@shared/api/common";
import {Layout} from "@shared/lib/layout";
import {Icon} from "@shared/ui/icons";
import {styling} from "@shared/lib/styling";
import {Nullable} from "@shared/lib/typings";
import {Text} from "@shared/ui/atoms";

interface UserActivityProps {
  type: ActivityType;
}

export const UserActivity: React.FC<UserActivityProps> = ({type}) => {
  let icon: Nullable<React.ReactNode> = null;
  let text: Nullable<string> = null;

  if (type === "in-match") {
    icon = <GamepadIcon />;
    text = "playing in a game";
  } else if (type === "spectation") {
    icon = <EyeIcon />;
    text = "spectate an ongoing game";
  } else if (type === "in-lobby") {
    icon = <FriendIcon />;
    text = "in a lobby";
  }

  return (
    <Layout.Row align="center" gap={1}>
      {icon}

      <Text transform="uppercase" size={1.4} weight={700} emphasis="secondary">
        {text}
      </Text>
    </Layout.Row>
  );
};

const GamepadIcon = styled(Icon.Gamepad)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};
  animation: ${styling.mixins.pulse} 1s ease infinite;
`;

const EyeIcon = styled(Icon.Eye)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};
  animation: ${styling.mixins.pulse} 1s ease infinite;
`;

const FriendIcon = styled(Icon.Friend)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};
  animation: ${styling.mixins.pulse} 1s ease infinite;
`;
