import React from "react";
import {styled} from "@mui/material";

import {MATCH_STATE} from "@entities/match";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

import {model} from "../model";

const TIMER = {
  INITIAL: 45000,
  DEFUSE_EXPLODING_KITTEN: 10000,
};

export const StateTimer: React.FC = () => {
  const match = model.useMatch()!;

  const [timer, setTimer] = React.useState(0);

  React.useEffect(() => {
    const isDEK = match.state.type === MATCH_STATE.DEK;

    let initial = TIMER.INITIAL;

    if (isDEK) initial = TIMER.DEFUSE_EXPLODING_KITTEN;

    setTimer(initial - (Date.now() - match.state.at));
  }, [match.state.at]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimer((timer) => {
        const result = timer - 1000;

        if (result < 0) return 0;
        else return result;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Wrapper>
      <Text font="primary" size={1.2} transform="uppercase">
        Timer
      </Text>

      <Text font="primary" size={3.6} transform="uppercase">
        {Math.floor(timer / 1000)}
      </Text>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  border-radius: 10px;
  background: ${({theme}) => theme.palette.background.paper};
  border: 2px solid ${({theme}) => theme.palette.divider};
  text-align: center;
  padding: 2rem;
`;
