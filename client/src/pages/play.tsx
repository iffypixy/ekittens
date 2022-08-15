import * as React from "react";
import {styled} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import dayjs from "dayjs";

import {H4, H6, Text} from "@shared/ui/atoms";
import {Layout} from "@shared/lib/layout";
import {CommonTemplate} from "@shared/ui/templates";
import {Header, Sidebar} from "@widgets/sidebar";
import {Icon} from "@shared/ui/icons";
import {useDispatch} from "@app/store";
import {matchModel} from "@entities/match";
import {socket} from "@shared/lib/ws";
import {matchEvents} from "@shared/api/match";
import {OngoingMatch} from "@shared/api/common";
import {interimModel} from "@shared/lib/interim";

export const PlayPage: React.FC = () => {
  const {t} = useTranslation("play");

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [queueAt, setQueueAt] = React.useState<number | null>(null);

  React.useEffect(() => {
    socket.on(
      matchEvents.client.MATCH_START,
      ({match}: {match: OngoingMatch}) => {
        dispatch(matchModel.actions.setMatch(match));

        dispatch(
          interimModel.actions.fetchUserSupplemental({
            ids: match.players.map((player) => player.id),
          }),
        );

        navigate(`/${match.id}`);
      },
    );
  }, []);

  const handleCreateLobbyButtonClick = () => {
    dispatch(matchModel.actions.createLobby())
      .unwrap()
      .then((res) => {
        dispatch(matchModel.actions.setLobby(res.lobby));

        dispatch(
          interimModel.actions.fetchUserSupplemental({
            ids: res.lobby.participants.map((participant) => participant.id),
          }),
        );

        navigate(`/lobby/${res.lobby.id}`);
      });
  };

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />

      {queueAt && (
        <MatchQueueIndicator
          handleQueueStop={() => {
            dispatch(matchModel.actions.leaveQueue());
            setQueueAt(null);
          }}
        />
      )}

      <CommonTemplate>
        <Header>{t("header")}</Header>

        <Layout.Col gap={5}>
          <Layout.Col gap={2}>
            <Layout.Row align="center" gap={1}>
              <RewardIcon />
              <H4>{t("w.competitive")}</H4>
            </Layout.Row>

            <Entrypoint
              onClick={() => {
                dispatch(matchModel.actions.joinQueue());

                setQueueAt(Date.now());
              }}
              icon={<EPPublicIcon />}
              title={t("w.matchmaking")}
              description={t("matchmaking-description")}
            />
          </Layout.Col>

          <Layout.Col gap={2}>
            <Layout.Row align="center" gap={1}>
              <FriendIcon />
              <H4>{t("w.casual")}</H4>
            </Layout.Row>

            <Entrypoint
              onClick={handleCreateLobbyButtonClick}
              icon={<EPPrivateIcon />}
              title={t("w.lobby")}
              description={t("lobby-description")}
            />
          </Layout.Col>
        </Layout.Col>
      </CommonTemplate>
    </>
  );
};

const RewardIcon = styled(Icon.Trophy)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};
`;

const FriendIcon = styled(Icon.Profile)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};
`;

const EPPublicIcon = styled(Icon.Gamepad)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.primary.main};
`;

const EPPrivateIcon = styled(Icon.Friend)`
  width: 3rem;
  fill: ${({theme}) => theme.palette.primary.main};
`;

interface EntrypointProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const Entrypoint: React.FC<EntrypointProps> = ({
  icon,
  title,
  description,
  onClick,
}) => (
  <EPWrapper role="button" gap={1.5} onClick={onClick}>
    {icon}
    <EPTitle>{title}</EPTitle>
    <EPDescription>{description}</EPDescription>
  </EPWrapper>
);

const EPWrapper = styled(Layout.Col)`
  width: 50rem;
  background-color: ${({theme}) => theme.palette.background.default};
  border: 2px solid ${({theme}) => theme.palette.divider};
  box-shadow: 0 2px ${({theme}) => theme.palette.divider};
  border-radius: 1rem;
  user-select: none;
  transition: 0.2s linear;
  cursor: pointer;
  padding: 1.8rem 2rem;

  &:hover {
    border-color: ${({theme}) => theme.palette.text.primary};
    box-shadow: 0 2px ${({theme}) => theme.palette.text.primary};
  }

  &:active {
    position: relative;
    top: 5px;
    box-shadow: none;
  }
`;

const EPTitle = styled(H6)`
  font-size: 1.4rem;
`;

const EPDescription = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.2rem;
  text-transform: uppercase;
`;

interface MatchQueueIndicatorProps {
  handleQueueStop: () => void;
}

const MatchQueueIndicator: React.FC<MatchQueueIndicatorProps> = (props) => {
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    setDuration(0);

    const interval = setInterval(() => {
      setDuration((duration) => duration + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <QueueIndicator justify="space-between" align="center">
      <Layout.Row gap={1.5}>
        <VSCircle>
          <VSText>x</VSText>
        </VSCircle>

        <Layout.Col>
          <QueueTitle>in queue</QueueTitle>
          <Text>{dayjs(duration * 1000).format("mm:ss")}</Text>
        </Layout.Col>
      </Layout.Row>

      <CrossIcon onClick={() => props.handleQueueStop()} />
    </QueueIndicator>
  );
};

const QueueIndicator = styled(Layout.Row)`
  width: 25rem;
  background-color: ${({theme}) => theme.palette.primary.main};
  border-radius: 2rem;
  position: fixed;
  bottom: 2.5rem;
  left: 2.5rem;
  padding: 1rem;
`;

const VSCircle = styled(Layout.Row)`
  justify-content: center;
  align-items: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: ${({theme}) => theme.palette.background.default};
`;

const VSText = styled(Text)`
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
`;

const CrossIcon = styled(Icon.Cross)`
  width: 2.5rem;
  fill: ${({theme}) => theme.palette.primary.contrastText};
  cursor: pointer;
`;

const QueueTitle = styled(H6)`
  font-size: 1.4rem;
`;
