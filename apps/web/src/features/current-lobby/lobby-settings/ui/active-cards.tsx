import React from "react";
import {css, styled} from "@mui/material";

import {useDispatch} from "@app/store";
import {viewerModel} from "@entities/viewer";
import {Card, CardName, cards} from "@entities/card";
import {currentLobbyModel} from "@features/current-lobby";

import {Layout} from "@shared/lib/layout";
import {Text} from "@shared/ui/atoms";

import {model} from "../model";

const deck = cards.collection.filter((card) => card !== "nope");

export const ActiveCards: React.FC = () => {
  const dispatch = useDispatch();

  const lobby = currentLobbyModel.useLobby()!;
  const credentials = viewerModel.useCredentials();

  const viewer = lobby.participants.find(
    (participant) => participant.id === credentials.id,
  );

  const isLeader = viewer!.role === "leader";

  const disabled = lobby.mode.payload?.disabled || [];

  const mode = lobby.mode.type;

  const isDefault = mode === "default";
  const isCore = mode === "core";
  const isRandom = mode === "random";
  const isCustom = mode === "custom";

  if (isDefault)
    return (
      <Layout.Row>
        {deck.map((card) => (
          <Card key={card} name={card} />
        ))}
      </Layout.Row>
    );

  if (isCore)
    return (
      <Layout.Row>
        <Card name="exploding-kitten" />
        <Card name="defuse" />
        <Card name="see-the-future-3x" />
        <Card name="attack" />
        <Card name="shuffle" />
        <Card name="skip" />
      </Layout.Row>
    );

  if (isRandom)
    return (
      <Text font="primary" size={5}>
        ???
      </Text>
    );

  if (isCustom) {
    const toggle = (card: CardName) => {
      if (!isLeader) return;

      let updated = disabled;

      const isExcluded = disabled.includes(card);

      if (isExcluded) {
        updated = updated.filter((c) => c !== card);
      } else {
        updated = [...updated, card];
      }

      dispatch(
        model.actions.setDisabledCardsAsync({
          lobbyId: lobby.id,
          cards: updated,
        }),
      )
        .unwrap()
        .then(() => {
          dispatch(
            currentLobbyModel.actions.setDisabledCards({
              cards: updated,
            }),
          );
        });
    };

    return (
      <Layout.Row>
        <Card name="exploding-kitten" />

        {deck
          .filter((card) => card !== "exploding-kitten")
          .map((card, idx) => (
            <CardWrapper
              key={idx}
              interactable={isLeader}
              excluded={disabled.includes(card)}
              onClick={() => toggle(card)}
            >
              <Card key={idx} name={card} />
            </CardWrapper>
          ))}
      </Layout.Row>
    );
  }

  return null;
};

interface CardWrapperStyledProps {
  excluded?: boolean;
  interactable?: boolean;
}

const CardWrapper = styled("div", {
  shouldForwardProp: (prop: string) =>
    !["excluded", "interactable"].includes(prop),
})<CardWrapperStyledProps>`
  transition: 0.2s linear;

  ${({excluded}) =>
    excluded &&
    css`
      filter: grayscale(1);
      opacity: 0.55;
    `}

  ${({interactable}) =>
    interactable &&
    css`
      cursor: pointer;

      &:active {
        transform: scale(0.9);
        transform-origin: 50% 50%;
      }
    `}
`;
