import {styled} from "@mui/material";
import * as React from "react";

import {Text} from "./text";

interface TimerProps {
  seconds: number;
  className?: string;
}

// let oldInterval: NodeJS.Timer | null = null;

export const Timer: React.FC<TimerProps> = ({seconds, className}) => {
  const [timeLeft, setTimeLeft] = React.useState<any>(seconds);

  React.useEffect(() => {
    if (timeLeft === 0) {
      setTimeLeft(null);
    }

    // exit early when we reach 0
    if (!timeLeft) return;

    // save intervalId to clear the interval when the
    // component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    // clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);
    // add timeLeft as a dependency to re-rerun the effect
    // when we update it
  }, [timeLeft]);

  return <Wrapper className={className}>{timeLeft}</Wrapper>;
};

const Wrapper = styled(Text)`
  font-size: 1.8rem;
  border-radius: 50%;
  padding: 1rem;
`;
