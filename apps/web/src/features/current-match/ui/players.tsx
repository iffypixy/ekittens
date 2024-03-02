import React from "react";
import {css, keyframes, styled} from "@mui/material";

import {MATCH_STATE} from "@entities/match";
import {Card, UnknownCard} from "@entities/card";

import {Layout} from "@shared/lib/layout";
import {styling} from "@shared/lib/styling";
import {Avatar, Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import explodingkitten from "@shared/assets/cards/exploding-kitten.png";
import implodingkitten from "@shared/assets/cards/imploding-kitten.png";

import {model} from "../model";

export const Players: React.FC = () => {
  const match = model.useMatch()!;

  return (
    <Wrapper w="100%" gap={5} p={3}>
      {[...match.players, ...match.out]
        .sort((a, b) => a.username.localeCompare(b.username))
        .map((player) => {
          const isTurn = match.players[match.turn]?.id === player.id;

          const type = match.state.type;

          const isDEK = isTurn && type === MATCH_STATE.DEK;
          const isIIK = isTurn && type === MATCH_STATE.IIK;

          const isOut = match.out.some((p) => p.id === player.id);

          return (
            <Player key={player.id} active={isTurn}>
              <Username>{player.username}</Username>

              {isOut ? (
                <SkullIcon />
              ) : (
                <>
                  <PlayerAvatar
                    size={15}
                    src={player.avatar}
                    animated={isTurn}
                  />

                  <Layout.Row
                    gap={-0.5}
                    style={{zIndex: 1, marginTop: "-2.5rem"}}
                  >
                    {player.cards.map((id, idx) =>
                      player.marked.some((card) => card?.id === id) ? (
                        <Card
                          key={idx}
                          name={
                            player.marked.find((card) => card?.id === id)!.name
                          }
                          mini
                        />
                      ) : (
                        <UnknownCard key={idx} mini />
                      ),
                    )}
                  </Layout.Row>
                </>
              )}

              {isDEK && <Action src={explodingkitten} $ek />}
              {isIIK && <Action src={implodingkitten} $ik />}
            </Player>
          );
        })}
    </Wrapper>
  );
};

const Wrapper = styled(Layout.Row)`
  flex-wrap: nowrap;
  overflow-x: auto;
  border-bottom: 2px dotted ${({theme}) => theme.palette.divider};
`;

interface PlayerStyledProps {
  active: boolean;
}

const shouldForwardProp = (prop: string) => !["active"].includes(prop);

const Player = styled(Layout.Col, {shouldForwardProp})<PlayerStyledProps>`
  align-items: center;
  position: relative;
  opacity: 0.35;

  ${({active}) =>
    active &&
    css`
      opacity: 1;
    `}

  &:first-child {
    margin-left: auto;
  }

  &:last-child {
    margin-right: auto;
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(184, 67, 44, 0.8);
  }

  100% {
    box-shadow: 0 0 0 30px rgba(184, 67, 44, 0);
  }
`;

interface PlayerAvatarStyledProps {
  animated?: boolean;
}

const PlayerAvatar = styled(Avatar, {
  shouldForwardProp,
})<PlayerAvatarStyledProps>`
  border-radius: 50%;

  ${({animated}) =>
    animated &&
    css`
      animation: ${pulse} 1s ease infinite;
    `}
`;

const Username = styled(Text)`
  color: ${({theme}) => theme.palette.common.white};
  font-family: "Bungee", sans-serif;
  font-size: 1.8rem;
  background-color: ${({theme}) => theme.palette.common.black};
  position: absolute;
  top: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
`;

interface ActionStyledProps {
  $ik?: boolean;
  $ek?: boolean;
}

const Action = styled("img")<ActionStyledProps>`
  width: 10rem;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  margin: auto;
  z-index: 2;
  animation: ${styling.mixins.pulse} 750ms infinite;

  ${({$ik}) =>
    $ik &&
    css`
      left: 21%;
      bottom: 22%;
    `}

  ${({$ek}) =>
    $ek &&
    css`
      left: 16%;
      bottom: 17%;
    `}
`;

const SkullIcon = styled(Icon.Skull)`
  width: 15rem;
  fill: ${({theme}) => theme.palette.text.primary};
  border: 1rem solid ${({theme}) => theme.palette.text.primary};
  border-radius: 50%;
`;
