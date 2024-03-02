import React from "react";
import {styled} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";
import {Header, Sidebar} from "@widgets/sidebar";
import {
  MatchmakingQueueIndicator,
  matchmakingQueueModel,
} from "@features/matchmaking-queue";
import {createLobbyModel} from "@features/create-lobby";
import {currentLobbyModel} from "@features/current-lobby";

import {H4, Text} from "@shared/ui/atoms";
import {CommonTemplate} from "@shared/ui/templates";
import {Icon} from "@shared/ui/icons";
import {Layout} from "@shared/lib/layout";
import {useSnackbar} from "notistack";

export const PlayPage: React.FC = () => {
  const {t} = useTranslation("play");

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {enqueueSnackbar} = useSnackbar();

  const lobby = currentLobbyModel.useLobby();

  const isEnqueued = useSelector(matchmakingQueueModel.selectors.isEnqueued);

  const handleCreateLobbyButtonClick = () => {
    if (lobby) {
      enqueueSnackbar("You must leave the lobby first", {
        variant: "error",
      });
    } else if (isEnqueued) {
      enqueueSnackbar("You must leave the matchmaking queue first", {
        variant: "error",
      });
    } else {
      dispatch(createLobbyModel.actions.createLobby())
        .unwrap()
        .then((res) => {
          dispatch(currentLobbyModel.actions.setLobby({lobby: res.lobby}));

          navigate(`/lobby/${res.lobby.id}`);
        });
    }
  };

  const handleQueueStart = () => {
    if (lobby) {
      enqueueSnackbar("You must leave the lobby first", {
        variant: "error",
      });
    } else {
      if (!isEnqueued) {
        dispatch(matchmakingQueueModel.actions.joinQueue())
          .unwrap()
          .then(() => {
            dispatch(
              matchmakingQueueModel.actions.setIsEnqueued({
                isEnqueued: true,
              }),
            );

            dispatch(
              matchmakingQueueModel.actions.setEnqueuedAt({
                enqueuedAt: Date.now(),
              }),
            );
          });
      }
    }
  };

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />
      <MatchmakingQueueIndicator />

      <CommonTemplate>
        <Header>{t("header")}</Header>

        <Layout.Col gap={5}>
          <Layout.Col gap={2}>
            <Layout.Row align="center" gap={1}>
              <RewardIcon />
              <H4>{t("w.competitive")}</H4>
            </Layout.Row>

            <Entrypoint
              handleClick={handleQueueStart}
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
              handleClick={handleCreateLobbyButtonClick}
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
  title: string;
  description: string;
  icon: React.ReactNode;
  handleClick: () => void;
}

const Entrypoint: React.FC<EntrypointProps> = ({
  icon,
  title,
  description,
  handleClick,
}) => (
  <EPWrapper role="button" gap={1.5} onClick={handleClick}>
    {icon}
    <Text size={1.4} weight={400} font="primary">
      {title}
    </Text>
    <Text emphasis="secondary" size={1.2} transform="uppercase">
      {description}
    </Text>
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
