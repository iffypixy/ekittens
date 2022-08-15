import * as React from "react";
import {useSelector} from "react-redux";
import {styled} from "@mui/material";

import {Layout} from "@shared/lib/layout";
import {matchModel} from "@entities/match";
import {Text} from "@shared/ui/atoms";

const TIMER = {
  INITIAL: 45000,
  ACTION_DELAY: 5000,
  EXPLODING_KITTEN_DEFUSE: 10000,
};

export const StateTimer: React.FC = () => {
  const match = useSelector(matchModel.selectors.match)!;

  const [timer, setTimer] = React.useState(0);

  React.useEffect(() => {
    const isAD = match.state.type === "action-delay";
    const isEKD = match.state.type === "exploding-kitten-defuse";

    let initial = TIMER.INITIAL;

    if (isAD) initial = TIMER.ACTION_DELAY;
    else if (isEKD) initial = TIMER.EXPLODING_KITTEN_DEFUSE;

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
      <Timer>{Math.floor(timer / 1000)}</Timer>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  border-radius: 1rem;
  background: ${({theme}) => theme.palette.background.paper};
  border: 2px solid ${({theme}) => theme.palette.divider};
  text-align: center;
  padding: 2rem;
`;

const Timer = styled(Text)`
  font-family: "Bungee", sans-serif;
  font-size: 5rem;
  text-transform: uppercase;
`;
