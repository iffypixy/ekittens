import React from "react";
import dayjs from "dayjs";
import {styled} from "@mui/material";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";

import {model} from "../model";

export const MatchmakingQueueIndicator: React.FC = () => {
  const dispatch = useDispatch();

  const isEnqueued = useSelector(model.selectors.isEnqueued);
  const enqueuedAt = useSelector(model.selectors.enqueuedAt);

  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    setDuration(Date.now() - enqueuedAt!);
  }, [enqueuedAt]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDuration((duration) => duration + 1000);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  if (!isEnqueued) return null;

  const handleQueueStop = () => {
    dispatch(model.actions.leaveQueue());

    dispatch(model.actions.setIsEnqueued({isEnqueued: false}));
  };

  return (
    <Wrapper>
      <Layout.Row gap={1.5}>
        <VS>
          <Text font="primary" transform="uppercase">
            x
          </Text>
        </VS>

        <Layout.Col justify="space-between">
          <Title>in queue</Title>

          <Duration>{dayjs(duration).format("mm:ss")}</Duration>
        </Layout.Col>
      </Layout.Row>

      <CrossIcon onClick={handleQueueStop} />
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Row)`
  width: 25rem;
  justify-content: space-between;
  align-items: center;
  background-color: ${({theme}) => theme.palette.primary.main};
  border-radius: 2rem;
  position: fixed;
  bottom: 2.5rem;
  left: 2.5rem;
  padding: 1.5rem;
`;

const VS = styled(Layout.Row)`
  width: 4rem;
  height: 4rem;
  background-color: ${({theme}) => theme.palette.background.default};
  justify-content: center;
  align-items: center;
  border-radius: 50%;
`;

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
  cursor: pointer;
`;

const Title = styled(Text)`
  color: ${({theme}) => theme.palette.primary.contrastText};
  font-family: "Bungee", sans-serif;
  font-weight: 400;
  font-size: 1.4rem;
`;

const Duration = styled(Text)`
  color: ${({theme}) => theme.palette.primary.contrastText};
`;
