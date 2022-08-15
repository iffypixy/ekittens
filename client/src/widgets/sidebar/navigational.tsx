import * as React from "react";
import {css, styled} from "@mui/material";
import {Link, useLocation} from "react-router-dom";
import {useSelector} from "react-redux";

import {Layout} from "@shared/lib/layout";
import {Icon} from "@shared/ui/icons";
import {styling} from "@shared/lib/styling";
import {authModel} from "@features/auth";
import {PreferencesModal} from "@features/preferences";

export const NavigationalSidebar: React.FC = () => {
  const credentials = useSelector(authModel.selectors.credentials)!;

  const location = useLocation();

  const [isPreferencesModalOpen, setIsPreferencesModalOpen] =
    React.useState(false);

  return (
    <>
      <PreferencesModal
        open={isPreferencesModalOpen}
        handleClose={() => setIsPreferencesModalOpen(false)}
      />

      <Wrapper align="center" gap={6}>
        <BurgerIcon />

        <Navigation as="nav" align="center" gap={3}>
          <Link to="/">
            <HomeIcon active={location.pathname === "/"} />
          </Link>
          <Link to={`/@/${credentials.username}`}>
            <ProfileIcon
              active={location.pathname === `/@/${credentials.username}`}
            />
          </Link>
          <Link to="/play">
            <PlayIcon active={location.pathname === "/play"} />
          </Link>
          <Link to="/leaderboard">
            <TrophyIcon active={location.pathname === "/leaderboard"} />
          </Link>
          <Link to="/about">
            <AboutIcon active={location.pathname === "/about"} />
          </Link>
        </Navigation>

        <SettingsIcon onClick={() => setIsPreferencesModalOpen(true)} />
      </Wrapper>
    </>
  );
};

const Wrapper = styled(Layout.Col)`
  width: 7.5rem;
  height: 100vh;
  background-color: ${({theme}) => theme.palette.background.paper};
  border-right: 2px solid ${({theme}) => theme.palette.divider};
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow: hidden;
  padding: 2rem;
`;

interface IconStyledProps {
  active: boolean;
}

const mixin = {
  icon: css`
    width: 2.5rem;
    cursor: pointer;
    transition: 0.05s linear;

    &:active {
      transform: scale(0.9);
      transform-origin: 50% 50%;
    }
  `,
};

const BurgerIcon = styled(Icon.Burger)`
  ${mixin.icon}

  width: 3rem;
  fill: ${({theme}) => theme.palette.text.secondary};
`;

const HomeIcon = styled(Icon.Home)<IconStyledProps>`
  ${mixin.icon}

  fill: ${({theme, active}) =>
    active ? theme.palette.primary.main : theme.palette.text.secondary};
`;

const ProfileIcon = styled(Icon.Profile)<IconStyledProps>`
  ${mixin.icon}

  fill: ${({theme, active}) =>
    active ? theme.palette.primary.main : theme.palette.text.secondary};
`;

const PlayIcon = styled(Icon.Play)<IconStyledProps>`
  ${mixin.icon}
  ${({active}) =>
    !active &&
    css`
      animation: ${styling.mixins.pulse} 0.5s infinite;
    `}

  fill: ${({theme, active}) =>
    active ? theme.palette.primary.main : theme.palette.text.secondary};
`;

const TrophyIcon = styled(Icon.Trophy)<IconStyledProps>`
  ${mixin.icon}

  fill: ${({theme, active}) =>
    active ? theme.palette.primary.main : theme.palette.text.secondary};
`;

const AboutIcon = styled(Icon.About)<IconStyledProps>`
  ${mixin.icon}

  fill: ${({theme, active}) =>
    active ? theme.palette.primary.main : theme.palette.text.secondary};
`;

const Navigation = styled(Layout.Col)`
  width: 100%;
`;

const SettingsIcon = styled(Icon.Settings)`
  width: 2.5rem;
  fill: ${({theme}) => theme.palette.text.secondary};
  cursor: pointer;
  transition: 0.05s linear;

  &:active {
    transform: scale(0.9);
    transform-origin: 50% 50%;
  }
`;
