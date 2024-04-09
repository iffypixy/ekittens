import React from "react";
import {css, styled} from "@mui/material";

import {currentLobbyModel} from "@features/current-lobby";
import {viewerModel} from "@entities/viewer";
import {useDispatch} from "@app/store";
import {LobbyModeType} from "@shared/api/common";
import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

import {model} from "../model";

export const GameModeSelection: React.FC = () => {
  const dispatch = useDispatch();

  const lobby = currentLobbyModel.useLobby()!;
  const credentials = viewerModel.useCredentials();

  const viewer = lobby.participants.find(
    (participant) => participant.id === credentials.id,
  )!;

  const isLeader = viewer.role === "leader";

  const mode = lobby.mode.type;

  const handleModeChange = (type: LobbyModeType) => {
    if (isLeader) {
      dispatch(
        model.actions.setModeAsync({
          lobbyId: lobby.id,
          type,
        }),
      );

      dispatch(
        currentLobbyModel.actions.setMode({
          mode: {
            type,
            payload: {
              disabled: type === "custom" ? [] : lobby.mode.payload?.disabled,
            },
          },
        }),
      );
    }
  };

  return (
    <Layout.Col gap={2}>
      <Layout.Row gap={2}>
        <Mode
          interactable={isLeader}
          tone="#00A800"
          active={mode === "default"}
          gap={1}
          onClick={() => handleModeChange("default")}
        >
          <Title>Default</Title>

          <Description active={mode === "default"}>
            Casual game mode with some special cards.
          </Description>
        </Mode>

        <Mode
          interactable={isLeader}
          tone="#42B0D1"
          active={mode === "core"}
          gap={1}
          onClick={() => handleModeChange("core")}
        >
          <Title>Core</Title>

          <Description active={mode === "core"}>
            Casual game mode with some special cards.
          </Description>
        </Mode>
      </Layout.Row>

      <Layout.Row gap={2}>
        <CustomMode
          interactable={isLeader}
          active={mode === "custom"}
          gap={1}
          onClick={() => handleModeChange("custom")}
        >
          <Layout.Row>
            <Title>Custom</Title>
          </Layout.Row>

          <CustomDescription active={mode === "custom"}>
            Fully customize your own game with special cards and rules.
          </CustomDescription>
        </CustomMode>
      </Layout.Row>
    </Layout.Col>
  );
};

interface ModeStyledProps {
  tone?: string;
  active: boolean;
  interactable: boolean;
}

const Mode = styled(Layout.Col, {
  shouldForwardProp: (prop: string) =>
    !["tone", "active", "interactable"].includes(prop),
})<ModeStyledProps>`
  color: ${({theme}) => theme.palette.text.primary};
  max-width: 30rem;
  background-color: ${({theme}) => theme.palette.background.default};
  border: 2px solid ${({theme}) => theme.palette.divider};
  border-radius: 5px;
  transition: 0.2s linear;
  padding: 1.5rem 2rem;

  ${({interactable}) =>
    interactable &&
    css`
      cursor: pointer;

      &:active {
        transform: scale(0.9);
        transform-origin: 50% 50%;
      }
    `}

  ${({active, tone}) =>
    active &&
    css`
      color: #ffffff;
      background-color: ${tone};
    `}
`;

const CustomMode = styled(Mode)`
  color: ${({theme}) => theme.palette.common.white};
  background-color: #3c3d3f;
  opacity: 0.65;
  border: none;

  ${({active}) =>
    active &&
    css`
      opacity: 1;
    `}
`;

const Title = styled(Text)`
  color: inherit;
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const Description = styled(Text)<{
  active: boolean;
}>`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.4rem;
  text-transform: lowercase;

  ${({active, theme}) =>
    active &&
    css`
      color: ${theme.palette.common.white};
    `}
`;

const CustomDescription = styled(Description)`
  color: ${({theme}) => theme.palette.common.white};
`;
