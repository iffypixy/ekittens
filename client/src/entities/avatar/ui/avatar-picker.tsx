import * as React from "react";
import {styled} from "@mui/material";

import {Col} from "@shared/lib/layout";
import {Icon} from "@shared/ui/atoms";
import {avatars} from "../lib";

export const AvatarPicker: React.FC = () => {
  const random = () => Math.floor(Math.random() * avatars.length);

  const [idx, setIdx] = React.useState(random());

  const handleResetButtonClick = () => {
    setIdx(random());
  };

  return (
    <Wrapper>
      <IMG src={avatars[idx]} alt="avatar" />
      <ResetButton onClick={handleResetButtonClick}>
        <ButtonIcon name="reset" />
      </ResetButton>
    </Wrapper>
  );
};

const Wrapper = styled(Col)`
  width: 25rem;
  border: 1rem solid #ffffff;
  border-radius: 50%;
  position: relative;
`;

const IMG = styled("img")`
  width: 100%;
  height: 100%;
  display: block;
`;

const ResetButton = styled("button")`
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
`;

const ButtonIcon = styled(Icon)`
  width: 100%;
  height: 100%;
  fill: #ffffff;
`;
