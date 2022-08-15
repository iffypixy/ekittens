import * as React from "react";
import {styled, Popover} from "@mui/material";
import {useSelector} from "react-redux";
import {Link, useNavigate} from "react-router-dom";
import dayjs from "dayjs";
import {useSnackbar} from "notistack";
import {useTranslation} from "react-i18next";

import {styling} from "@shared/lib/styling";
import {Tab, Tabs} from "@shared/ui/molecules";
import {Layout} from "@shared/lib/layout";
import {Icon} from "@shared/ui/icons";
import {Avatar, H6, Text} from "@shared/ui/atoms";
import {Match as TM, User, UserSupplemental} from "@shared/api/common";
import {Empty} from "@shared/ui/organisms";
import {interimModel} from "@shared/lib/interim";
import {rating} from "../lib/rating";
import {Actions} from "@shared/ui/molecules/actions";
import {useDispatch} from "@app/store";
import {userModel} from "@entities/user";
import {matchModel} from "@entities/match";

export interface ProfileHubProps {
  friends: User[];
  matches: TM[];
  own: boolean;
}

type ProfileHubTab = "matches" | "friends";

export const ProfileHub: React.FC<ProfileHubProps> = ({
  friends,
  matches,
  own,
}) => {
  const {t} = useTranslation("common");

  const [tab, setTab] = React.useState<ProfileHubTab>("matches");

  const supplementals = useSelector(interimModel.selectors.supplementals);

  const handleTabChange = (_: React.SyntheticEvent, tab: ProfileHubTab) => {
    setTab(tab);
  };

  const isMatchesTab = tab === "matches";
  const isFriendsTab = tab === "friends";

  const noMatches = matches.length === 0;
  const noFriends = friends.length === 0;

  return (
    <Wrapper gap={2}>
      <Tabs value={tab} onChange={handleTabChange}>
        <Tab
          value="matches"
          label={
            <Layout.Row align="center" gap={1}>
              <GamepadIcon />
              <span>{t("w.games")}</span>
            </Layout.Row>
          }
        />
        <Tab
          value="friends"
          label={
            <Layout.Row align="center" gap={1}>
              <FriendIcon />
              <span>{t("w.friends")}</span>
            </Layout.Row>
          }
        />
      </Tabs>

      <Panel justify="center" align="center">
        {isMatchesTab &&
          (noMatches ? (
            <Layout.Col p={5}>
              <Empty
                withSubtitle={own}
                icon={<KittenJoyIcon />}
                title={t("w.no-matches")}
                subtitle={t("no-matches-subtext")}
              />
            </Layout.Col>
          ) : (
            <MatchesList matches={matches} />
          ))}

        {isFriendsTab &&
          (noFriends ? (
            <Layout.Col p={5}>
              <Empty
                withSubtitle={own}
                icon={<KittenJoyIcon />}
                title={t("w.no-friends")}
                subtitle={t("no-friends-subtext")}
              />
            </Layout.Col>
          ) : (
            <FriendsList
              withActions={own}
              friends={friends.map((friend) => ({
                ...friend,
                ...supplementals[friend.id],
              }))}
            />
          ))}
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
`;

interface MatchesListProps {
  matches: TM[];
}

const MatchesList: React.FC<MatchesListProps> = ({matches}) => {
  const {t} = useTranslation("common");

  return (
    <Layout.Col w="100%" py={3} gap={3}>
      {matches.map((match, idx) => (
        <Match
          key={idx}
          result={match.result}
          w="100%"
          align="flex-start"
          justify="space-between"
          px={3}
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
              <Against>X</Against>

              <Layout.Row gap={1}>
                {match.opponents.map((opponent) => (
                  <Link
                    key={opponent.user.id}
                    to={`/@/${opponent.user.username}`}
                  >
                    <Opponent size={3} src={opponent.user.avatar} />
                  </Link>
                ))}
              </Layout.Row>
            </Layout.Row>

            <Text color="secondary">
              {dayjs(match.createdAt).format("DD.MM.YYYY")}
            </Text>
          </Layout.Row>
        </Match>
      ))}
    </Layout.Col>
  );
};

const Against = styled(H6)``;

interface MatchStyledProps {
  result: string;
}

const Match = styled(Layout.Col)<MatchStyledProps>`
  color: ${({theme, result}) =>
    result === "victory"
      ? theme.palette.success.main
      : theme.palette.error.main};
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
  friends: (User & UserSupplemental)[];
  withActions: boolean;
}

const FriendsList: React.FC<FriendsListProps> = ({friends, withActions}) => {
  const {t} = useTranslation("common");

  return (
    <Layout.Col w="100%" py={3} gap={3}>
      {[
        ...friends.filter((friend) => friend?.status === "online"),
        ...friends.filter((friend) => friend?.status === "offline"),
      ].map((friend, idx) => {
        let activity: React.ReactNode | null = null;

        const hasActivity = !!friend.activity;

        if (hasActivity) {
          const type = friend.activity!.type;

          if (type === "in-match") {
            activity = (
              <>
                <ActivityGamepadIcon />
                <FriendActivity>{t("status.in-game")}</FriendActivity>
              </>
            );
          } else if (type === "spectate") {
            activity = (
              <>
                <ActivityEyeIcon />
                <FriendActivity>{t("status.spectation")}</FriendActivity>
              </>
            );
          }
        }

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
                  online={friend.status === "online"}
                  showStatus={!!friend.status}
                />
              </Link>

              <Layout.Col gap={1}>
                <Link
                  to={`/@/${friend.username}`}
                  style={{textDecoration: "none"}}
                >
                  <FriendUsername>{friend.username}</FriendUsername>
                </Link>

                {hasActivity && (
                  <Layout.Row align="center" gap={1}>
                    {activity}
                  </Layout.Row>
                )}
              </Layout.Col>
            </Layout.Row>

            {withActions && <FriendActions friend={friend} />}
          </Layout.Row>
        );
      })}
    </Layout.Col>
  );
};

const ActivityGamepadIcon = styled(Icon.Gamepad)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.secondary};

  ${styling.mixins.pulse}
`;

const ActivityEyeIcon = styled(Icon.Eye)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.secondary};

  ${styling.mixins.pulse}
`;

interface FriendActionsProps {
  friend: User;
}

const FriendActions: React.FC<FriendActionsProps> = ({friend}) => {
  const {t} = useTranslation("common");

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const {enqueueSnackbar} = useSnackbar();

  const [anchor, setAnchor] = React.useState<SVGElement | null>(null);

  const supplementals = useSelector(interimModel.selectors.supplementals);

  const handleClick = (event: React.MouseEvent<SVGElement>) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const supplemental = supplementals[friend.id];

  const isInGame = supplemental?.activity?.type === "in-match";

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
          {isInGame && (
            <Actions.Item
              icon={<EyeIcon />}
              onClick={() => {
                dispatch(
                  matchModel.actions.spectateMatch({
                    matchId: supplemental!.activity!.matchId!,
                  }),
                )
                  .unwrap()
                  .then((res) => {
                    dispatch(
                      interimModel.actions.fetchUserSupplemental({
                        ids: [
                          ...res.match.players,
                          ...res.match.spectators,
                        ].map(({id}) => id),
                      }),
                    );

                    dispatch(matchModel.actions.setMatch(res.match));

                    navigate(`/${res.match.id}`);
                  });
              }}
            >
              <SpectateText>{t("action.spectate-game")}</SpectateText>
            </Actions.Item>
          )}

          <Actions.Item
            icon={<CrossIcon />}
            onClick={() => {
              dispatch(userModel.actions.unfriend({userId: friend.id}))
                .unwrap()
                .then(() => {
                  enqueueSnackbar(
                    `${t("notification.you-unfriended")} ${friend.username}`,
                    {variant: "success"},
                  );

                  dispatch(userModel.actions.removeFriend({id: friend.id}));
                });
            }}
          >
            <UnfriendText>{t("action.unfriend")}</UnfriendText>
          </Actions.Item>
        </Actions.List>
      </Popover>
    </>
  );
};

const FriendUsername = styled(Text)`
  font-family: "Bungee", sans-serif;
  text-transform: uppercase;
  text-decoration: none;
`;

const FriendActivity = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  text-transform: lowercase;
`;

const ActionsIcon = styled(Icon.Actions)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.text.secondary};
  cursor: pointer;
`;

const UnfriendText = styled(Text)`
  color: ${({theme}) => theme.palette.error.main};
  font-weight: 700;
`;

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
  cursor: pointer;
`;

const SpectateText = styled(Text)`
  color: ${({theme}) => theme.palette.success.main};
  font-weight: 700;
`;

const EyeIcon = styled(Icon.Eye)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.success.main};
  cursor: pointer;
`;
