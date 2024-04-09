import React from "react";
import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";
import {viewerModel} from "@entities/viewer";
import {chatModel} from "@features/chat";
import {
  matchEvents,
  SelfVictoryEventOptions,
  VictoryEventOptions,
  SelfPlayerDefeatEventOptions,
  PlayerDefeatEventOptions,
  CardMarkEventOptions,
  SelfCardMarkEventOptions,
  IKSpotChangeEventOptions,
  ReversedChangeEventOptions,
  FutureCardsReceiveEventOptions,
  SelfFutureCardsPlayerShareEventOptions,
} from "@shared/api/match";
import {chatEvents} from "@shared/api/chat";

import * as selectors from "./selectors";
import {matchResultsModel} from "../match-results";
import {inGameInteractionsModel, MODAL} from "../in-game-interactions";
import * as actions from "./actions";

export const useMatch = () => useSelector(selectors.match);

export const useWsHandlers = () => {
  const dispatch = useDispatch();

  const credentials = viewerModel.useCredentials();

  const handleSelfVictoryEvent = React.useCallback(
    ({shift, rating}: SelfVictoryEventOptions) => {
      dispatch(
        matchResultsModel.actions.setPersonalResults({
          results: {
            reason: null,
            type: "victory",
            rating,
            shift,
          },
        }),
      );
    },
    [],
  );

  const handleVictoryEvent = React.useCallback(
    ({winner, rating, shift}: VictoryEventOptions) => {
      dispatch(
        matchResultsModel.actions.setGeneralResults({
          results: {
            winner,
            rating,
            shift,
          },
        }),
      );
    },
    [],
  );

  const handleSelfPlayerDefeatEvent = React.useCallback(
    ({shift, reason, rating}: SelfPlayerDefeatEventOptions) => {
      dispatch(
        matchResultsModel.actions.setPersonalResults({
          results: {
            type: "defeat",
            rating,
            shift,
            reason,
          },
        }),
      );
    },
    [],
  );

  const handlePlayerDefeatEvent = React.useCallback(
    ({player, reason}: PlayerDefeatEventOptions) => {
      dispatch(
        actions.removeActivePlayer({
          playerId: player.id,
        }),
      );

      dispatch(
        actions.addInactivePlayer({
          player: {
            ...player,
            reason,
          },
        }),
      );
    },
    [],
  );

  const handleCardMarkEvent = React.useCallback(
    ({card, playerId}: CardMarkEventOptions) => {
      dispatch(
        actions.addMarkedCard({
          card,
          playerId,
        }),
      );
    },
    [],
  );

  const handleSelfCardMarkEvent = React.useCallback(
    ({card}: SelfCardMarkEventOptions) => {
      dispatch(
        actions.addMarkedCard({
          card,
          playerId: credentials.id,
        }),
      );
    },
    [],
  );

  const handleIKSpotChangeEvent = React.useCallback(
    ({spot}: IKSpotChangeEventOptions) => {
      dispatch(
        actions.setContext({
          context: {
            ikspot: spot,
          },
        }),
      );
    },
    [],
  );

  const handleExplodingKittenInsertEvent = React.useCallback(() => {
    dispatch(actions.incrementDrawPileCards());
  }, []);

  const handleSelfExplodingKittenInsertEvent = React.useCallback(() => {
    dispatch(actions.incrementDrawPileCards());
  }, []);

  const handleFutureCardsReceiveEvent = React.useCallback(
    ({cards}: FutureCardsReceiveEventOptions) => {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.SEE_THE_FUTURE,
          data: {
            open: true,
            payload: {
              cards,
            },
          },
        }),
      );
    },
    [],
  );

  const handleSelfFutureCardsPlayerShareEvent = React.useCallback(
    ({cards}: SelfFutureCardsPlayerShareEventOptions) => {
      dispatch(
        inGameInteractionsModel.actions.setModalData({
          modal: MODAL.SHARED_CARDS,
          data: {
            open: true,
            payload: {
              cards,
            },
          },
        }),
      );
    },
    [],
  );

  const handleReversedChangeEvent = React.useCallback(
    ({reversed}: ReversedChangeEventOptions) => {
      dispatch(
        actions.setContext({
          context: {reversed},
        }),
      );
    },
    [],
  );

  const handleAttacksChangeEvent = React.useCallback(({attacks}) => {
    dispatch(
      actions.setContext({
        context: {attacks},
      }),
    );
  }, []);

  const handleCardDrawEvent = React.useCallback(({playerId, cardId}) => {
    dispatch(actions.decrementDrawPileCards());

    dispatch(
      actions.incrementPlayerCards({
        playerId,
        cardId,
      }),
    );
  }, []);

  const handleSelfExplosionEvent = React.useCallback(() => {
    dispatch(actions.decrementDrawPileCards());
  }, []);

  const handleExplosionEvent = React.useCallback(() => {
    dispatch(actions.decrementDrawPileCards());
  }, []);

  const handleSelfCardDrawEvent = React.useCallback(({card}) => {
    dispatch(actions.addDeckCard({card}));
    dispatch(actions.decrementDrawPileCards());

    dispatch(
      actions.incrementPlayerCards({
        playerId: credentials.id,
        cardId: card.id,
      }),
    );
  }, []);

  const handleSelfCardPlayEvent = React.useCallback(({card}) => {
    dispatch(
      actions.decrementPlayerCards({
        playerId: credentials.id,
        cardId: card.id,
      }),
    );

    dispatch(actions.setLast({last: credentials?.id}));
  }, []);

  const handleSelfBottomCardDrawEvent = React.useCallback(({card}) => {
    dispatch(actions.addDeckCard({card}));

    dispatch(actions.decrementDrawPileCards());

    dispatch(
      actions.incrementPlayerCards({
        playerId: credentials.id,
        cardId: card.id,
      }),
    );
  }, []);

  const handleBottomCardDrawEvent = React.useCallback(({playerId, cardId}) => {
    dispatch(actions.decrementDrawPileCards());

    dispatch(
      actions.incrementPlayerCards({
        playerId,
        cardId,
      }),
    );
  }, []);

  const handleCardPlayEvent = React.useCallback(({playerId, card}) => {
    dispatch(
      actions.decrementPlayerCards({
        playerId,
        cardId: card.id,
      }),
    );

    dispatch(actions.addDiscardPileCard({card: card.name}));

    dispatch(actions.setLast({last: playerId}));
  }, []);

  const handleStateChangeEvent = React.useCallback(({state}) => {
    dispatch(actions.setState({state}));
  }, []);

  const handleTurnChangeEvent = React.useCallback(({turn}) => {
    dispatch(actions.setTurn({turn}));
  }, []);

  const handleNewSpectatorEvent = React.useCallback(({user}) => {
    dispatch(actions.addSpectator({spectator: user}));
  }, []);

  const handleSpectatorLeaveEvent = React.useCallback(({userId}) => {
    dispatch(actions.removeSpectator({spectatorId: userId}));
  }, []);

  const handleNewMessageEvent = React.useCallback(({message}) => {
    dispatch(chatModel.actions.addMessage({message}));
  }, []);

  const handleExplosionDefuseEvent = React.useCallback(({cardId, playerId}) => {
    dispatch(actions.decrementPlayerCards({cardId, playerId}));

    dispatch(actions.addDiscardPileCard({card: "defuse"}));
  }, []);

  const handlers = React.useMemo(
    () => ({
      [matchEvents.client.SELF_VICTORY]: handleSelfVictoryEvent,
      [matchEvents.client.VICTORY]: handleVictoryEvent,
      [matchEvents.client.SELF_PLAYER_DEFEAT]: handleSelfPlayerDefeatEvent,
      [matchEvents.client.PLAYER_DEFEAT]: handlePlayerDefeatEvent,
      [matchEvents.client.CARD_MARK]: handleCardMarkEvent,
      [matchEvents.client.SELF_CARD_MARK]: handleSelfCardMarkEvent,
      [matchEvents.client.IK_SPOT_CHANGE]: handleIKSpotChangeEvent,
      [matchEvents.client.EXPLODING_KITTEN_INSERT]:
        handleExplodingKittenInsertEvent,
      [matchEvents.client.SELF_EXPLODING_KITTEN_INSERT]:
        handleSelfExplodingKittenInsertEvent,
      [matchEvents.client.FUTURE_CARDS_RECEIVE]: handleFutureCardsReceiveEvent,
      [matchEvents.client.SELF_FUTURE_CARDS_PLAYER_SHARE]:
        handleSelfFutureCardsPlayerShareEvent,
      [matchEvents.client.REVERSED_CHANGE]: handleReversedChangeEvent,
      [matchEvents.client.ATTACKS_CHANGE]: handleAttacksChangeEvent,
      [matchEvents.client.CARD_DRAW]: handleCardDrawEvent,
      [matchEvents.client.EXPLOSION]: handleExplosionEvent,
      [matchEvents.client.SELF_EXPLOSION]: handleSelfExplosionEvent,
      [matchEvents.client.SELF_CARD_DRAW]: handleSelfCardDrawEvent,
      [matchEvents.client.SELF_CARD_PLAY]: handleSelfCardPlayEvent,
      [matchEvents.client.SELF_BOTTOM_CARD_DRAW]: handleSelfBottomCardDrawEvent,
      [matchEvents.client.BOTTOM_CARD_DRAW]: handleBottomCardDrawEvent,
      [matchEvents.client.CARD_PLAY]: handleCardPlayEvent,
      [matchEvents.client.STATE_CHANGE]: handleStateChangeEvent,
      [matchEvents.client.TURN_CHANGE]: handleTurnChangeEvent,
      [matchEvents.client.NEW_SPECTATOR]: handleNewSpectatorEvent,
      [matchEvents.client.SPECTATOR_LEAVE]: handleSpectatorLeaveEvent,
      [matchEvents.client.EXPLOSION_DEFUSE]: handleExplosionDefuseEvent,
      [chatEvents.client.NEW_MESSAGE]: handleNewMessageEvent,
    }),
    [],
  );

  return {handlers};
};
