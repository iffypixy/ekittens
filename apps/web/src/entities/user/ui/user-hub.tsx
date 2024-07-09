import React from "react";
import {styled, Popover} from "@mui/material";
import {useNavigate} from "react-router-dom";
import dayjs from "dayjs";
import {useSnackbar} from "notistack";
import {useTranslation} from "react-i18next";

import {useDispatch} from "@app/store";
import {UserActivity, userModel} from "@entities/user";
import {rating} from "@entities/match";
import {viewerModel} from "@entities/viewer";

import {Layout} from "@shared/lib/layout";
import {Icon} from "@shared/ui/icons";
import {Avatar, Text, Link} from "@shared/ui/atoms";
import {Match as IMatch, User, UserWithInterim} from "@shared/api/common";
import {Actions, Empty, Tab, Tabs} from "@shared/ui/molecules";
import {Nullable} from "@shared/lib/typings";
import {StylingColorType} from "@shared/lib/styling";

export interface UserHubProps {
  friends: Nullable<User[]>;
  matches: Nullable<IMatch[]>;
  isOwn: boolean;
}

type UserHubTab = "matches" | "friends";

const TABS = {
  MATCHES: "matches",
  FRIENDS: "friends",
};

export const UserHub: React.FC<UserHubProps> = ({friends, matches, isOwn}) => {
  const {t} = useTranslation("common");

  const [tab, setTab] = React.useState<UserHubTab>("matches");

  const handleTabChange = (_: React.SyntheticEvent, tab: UserHubTab) => {
    setTab(tab);
  };

  const isMatchesTab = tab === "matches";
  const isFriendsTab = tab === "friends";

  const showMatches = isMatchesTab && matches;
  const showFriends = isFriendsTab && friends;

  return (
    <Wrapper gap={2}>
      <Tabs value={tab} onChange={handleTabChange}>
        <Tab
          value={TABS.MATCHES}
          label={
            <Layout.Row align="center" gap={1}>
              <GamepadIcon />
              <span>{t("w.games")}</span>
            </Layout.Row>
          }
        />
        <Tab
          value={TABS.FRIENDS}
          label={
            <Layout.Row align="center" gap={1}>
              <FriendIcon />
              <span>{t("w.friends")}</span>
            </Layout.Row>
          }
        />
      </Tabs>

      <Panel justify="center" align="center">
        {showMatches && <MatchesTab matches={matches} showHelper={isOwn} />}

        {showFriends && (
          <FriendsTab
            friends={friends}
            showActions={isOwn}
            showHelper={isOwn}
          />
        )}
      </Panel>
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Col)`
  max-width: 50rem;
  width: 100%;
`;

const GamepadIcon = styled(Icon.Gamepad)`
  fill: ${({theme}) => theme.palette.text.primary};
  width: 2rem;
`;

const FriendIcon = styled(Icon.Friend)`
  fill: ${({theme}) => theme.palette.text.primary};
  width: 2rem;
`;

const Panel = styled(Layout.Col)`
  width: 100%;
  background-color: ${({theme}) => theme.palette.background.paper};
  border-radius: 1rem;
`;

const KittenJoyIcon = styled(Icon.KittenJoy)`
  width: 10rem;
  fill: ${({theme}) => theme.palette.text.primary};
`;

interface MatchesTabProps {
  matches: IMatch[];
  showHelper: boolean;
}

const MatchesTab: React.FC<MatchesTabProps> = ({matches, showHelper}) => {
  const {t} = useTranslation("common");

  const isEmpty = matches.length === 0;

  if (isEmpty)
    return (
      <Layout.Col p={5}>
        <Empty
          icon={<KittenJoyIcon />}
          title={t("w.no-matches")}
          subtitle={t("no-matches-subtext")}
          showSubtitle={showHelper}
        />
      </Layout.Col>
    );

  return <MatchesList matches={matches} />;
};

interface FriendsTabProps {
  friends: User[];
  showActions: boolean;
  showHelper: boolean;
}

const FriendsTab: React.FC<FriendsTabProps> = ({
  friends,
  showActions,
  showHelper,
}) => {
  const {t} = useTranslation("common");

  const interims = userModel.useInterims();

  const isEmpty = friends.length === 0;

  if (isEmpty)
    return (
      <Layout.Col p={5}>
        <Empty
          icon={<KittenJoyIcon />}
          title={t("w.no-friends")}
          subtitle={t("no-friends-subtext")}
          showSubtitle={showHelper}
        />
      </Layout.Col>
    );

  const friendsWithInterim = friends.map((friend) => ({
    ...friend,
    interim: interims[friend.id],
  }));

  return <FriendsList friends={friendsWithInterim} showActions={showActions} />;
};

interface MatchesListProps {
  matches: IMatch[];
}

const MatchesList: React.FC<MatchesListProps> = ({matches}) => {
  const {t} = useTranslation("common");

  return (
    <Layout.Col w="100%" py={3} gap={3}>
      {matches.map((match, idx) => (
        <Match
          key={idx}
          color={match.result === "victory" ? "success" : "error"}
          gap={2}
        >
          <Layout.Row w="100%" justify="space-between">
            <MatchDetails>
              {match.result === "victory" ? t("w.victory") : t("w.defeat")}
            </MatchDetails>

            <Layout.Row align="center" gap={0.5}>
              <Text>{match.player.rating}</Text>

              <MatchDetails>
                {rating.adjustShift(match.player.shift)}
              </MatchDetails>
            </Layout.Row>
          </Layout.Row>

          <Layout.Row w="100%" justify="space-between" align="center">
            <Layout.Row gap={2} align="center">
              <Text font="primary" weight={700} transform="uppercase">
                X
              </Text>

              <Layout.Row gap={1}>
                {match.opponents.map((opponent) => (
                  <Link
                    key={opponent.user.id}
                    to={`/@/${opponent.user.username}`}
                  >
                    <Opponent src={opponent.user.avatar} size={3} />
                  </Link>
                ))}
              </Layout.Row>
            </Layout.Row>

            <Text emphasis="secondary">
              {dayjs(match.createdAt).format("DD.MM.YYYY")}
            </Text>
          </Layout.Row>
        </Match>
      ))}
    </Layout.Col>
  );
};

interface MatchStyledProps {
  color: StylingColorType;
}

const Match = styled(Layout.Col)<MatchStyledProps>`
  color: ${({theme, color}) => theme.palette[color].main};
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 3rem;
`;

const MatchDetails = styled(Text)`
  color: inherit;
  font-weight: 700;
  text-transform: uppercase;
`;

const Opponent = styled(Avatar)`
  cursor: pointer;
`;

interface FriendsListProps {
  friends: UserWithInterim[];
  showActions: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({friends, showActions}) => (
  <Layout.Col w="100%" py={3} gap={3}>
    {[...friends]
      .sort((a, b) => {
        const isOnlineA = a.interim?.status === "online";
        const isOnlienB = b.interim?.status === "online";

        return isOnlineA === isOnlienB ? 0 : isOnlineA ? -1 : 1;
      })
      .map((friend, idx) => {
        const activity = friend.interim?.activity;
        const status = friend.interim?.status;

        return (
          <Layout.Row
            key={idx}
            align="flex-start"
            px={3}
            justify="space-between"
          >
            <Layout.Row align="center" gap={3}>
              <Link to={`/@/${friend.username}`}>
                <Avatar
                  size={7}
                  src={friend.avatar}
                  status={status}
                  showStatus={!!status}
                />
              </Link>

              <Layout.Col gap={1}>
                <Link to={`/@/${friend.username}`}>
                  <Text font="primary" transform="uppercase">
                    {friend.username}
                  </Text>
                </Link>

                {activity && <UserActivity type={activity.type} />}
              </Layout.Col>
            </Layout.Row>

            {showActions && <FriendActions friend={friend} />}
          </Layout.Row>
        );
      })}
  </Layout.Col>
);

interface FriendActionsProps {
  friend: UserWithInterim;
}

const FriendActions: React.FC<FriendActionsProps> = ({friend}) => {
  const {t} = useTranslation("common");

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {enqueueSnackbar} = useSnackbar();

  const [anchor, setAnchor] = React.useState<SVGElement | null>(null);

  const handleClick = (event: React.MouseEvent<SVGElement>) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const activity = friend.interim?.activity;

  const isInMatch = activity?.type === "in-match";
  const isInLobby = activity?.type === "in-lobby";
  const isSpectator = activity?.type === "spectation";

  const handleSpectateMatchButtonClick = () => {
    navigate(`/${activity?.matchId}`);

    // dispatch(
    //   joinMatchModel.actions.joinAsSpectator({
    //     matchId: activity!.matchId!,
    //   }),
    // )
    //   .unwrap()
    //   .then((res) => {
    //     const ids = [...res.match.players, ...res.match.spectators].map(
    //       (p) => p.id,
    //     );

    //     dispatch(userModel.actions.fetchInterim({ids}));

    //     dispatch(currentMatchModel.actions.setMatch({match: res.match}));

    //     navigate(`/${res.match.id}`);
    //   });
  };

  const handleJoinLobbyButtonClick = () => {
    navigate(`/lobby/${activity?.lobbyId}`);
  };

  const handleUnfriendButtonClick = () => {
    dispatch(userModel.actions.unfriendFriend({userId: friend.id}))
      .unwrap()
      .then(() => {
        enqueueSnackbar(
          `${t("notification.you-unfriended")} ${friend.username}`,
          {variant: "success"},
        );

        dispatch(viewerModel.actions.removeFriend({friendId: friend.id}));
      });
  };

  return (
    <>
      <ActionsIcon onClick={handleClick} />

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{horizontal: "left", vertical: "bottom"}}
      >
        <Actions.List>
          {isInMatch && (
            <Actions.Item
              icon={<EyeIcon />}
              onClick={handleSpectateMatchButtonClick}
            >
              <Text color="success" weight={700} transform="uppercase">
                {t("action.spectate-game")}
              </Text>
            </Actions.Item>
          )}

          {isInLobby && (
            <Actions.Item
              icon={<ActionFriendIcon />}
              onClick={handleJoinLobbyButtonClick}
            >
              <Text color="success" weight={700} transform="uppercase">
                {t("action.join-lobby")}
              </Text>
            </Actions.Item>
          )}

          {isSpectator && (
            <Actions.Item
              icon={<EyeIcon />}
              onClick={handleSpectateMatchButtonClick}
            >
              <Text color="success" weight={700} transform="uppercase">
                {t("action.spectate-game")}
              </Text>
            </Actions.Item>
          )}

          <Actions.Item
            icon={<CrossIcon />}
            onClick={handleUnfriendButtonClick}
          >
            <Text color="error" weight={700} transform="uppercase">
              {t("action.unfriend")}
            </Text>
          </Actions.Item>
        </Actions.List>
      </Popover>
    </>
  );
};

const ActionsIcon = styled(Icon.Actions)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.secondary};
  cursor: pointer;
`;

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
  cursor: pointer;
`;

const EyeIcon = styled(Icon.Eye)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.success.main};
  cursor: pointer;
`;

const ActionFriendIcon = styled(Icon.Friend)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.success.main};
  cursor: pointer;
`;
