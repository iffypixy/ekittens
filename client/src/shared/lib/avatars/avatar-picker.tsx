import * as React from "react";
import {styled} from "@mui/material";

import {Col} from "@shared/lib/layout";
import {Icon} from "@shared/ui/atoms";
import {avatars} from "./avatars";

interface AvatarPickerProps {
  handleReset: (avatar: number) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({handleReset}) => {
  const random = () => Math.floor(Math.random() * avatars.length);

  const [avatar, setAvatar] = React.useState(random());

  React.useEffect(() => {
    handleReset(avatar);
  }, [avatar]);

  const handleClick = () => {
    setAvatar(random());
  };

  return (
    <Wrapper>
      <IMG src={avatars[avatar]} alt="avatar" />
      <ResetButton onClick={handleClick}>
        <ButtonIcon name="reset" />
      </ResetButton>
    </Wrapper>
  );
};

const Wrapper = styled(Col)`
  width: 25rem;
  border-radius: 50%;
  position: relative;

  @media (max-width: 480px) {
    width: 15rem;
  }
`;

const IMG = styled("img")`
  width: 100%;
  height: 100%;
  display: block;
`;

const ResetButton = styled("button")`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  background-color: #000000;
  border: none;
  cursor: pointer;
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 1rem;

  @media (max-width: 480px) {
    width: 4.5rem;
    height: 4.5rem;
    padding: 0.5rem;
  }
`;

const ButtonIcon = styled(Icon)`
  width: 100%;
  height: 100%;
  fill: #ffffff;

  @media (max-width: 480px) {
    width: 1.5rem;
  }
`;
