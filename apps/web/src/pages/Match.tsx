import type { Card, CommandWire, MatchView } from "@ekittens/contract";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useGameSocket } from "../app/socket.tsx";
import { api } from "../lib/api.ts";
import { useMatchStore } from "../lib/store.ts";
import { Button } from "../ui/Button.tsx";

const PLAYABLE_SINGLE = new Set(["skip", "attack", "shuffle", "see-the-future"]);

type Send = (command: CommandWire) => void;

const Centered = ({ children }: { children: ReactNode }) => (
  <main className="min-h-screen grid place-items-center p-6">
    <div className="flex flex-col items-center gap-4 text-center">{children}</div>
  </main>
);

const short = (id: string): string => id.slice(0, 6);

const playFromHand = (view: MatchView, card: Card, myId: string, send: Send): void => {
  if (view.phase !== "waiting-for-action" || view.turn !== myId) return;
  if (PLAYABLE_SINGLE.has(card.name)) {
    send({ type: "play-card", card: card.id });
  } else if (card.name === "favor") {
    const target = view.opponents.find((opponent) => !view.out.includes(opponent.id));
    if (target) send({ type: "play-card", card: card.id, target: target.id });
  }
};

const Prompt = ({ view, myId, send }: { view: MatchView; myId: string; send: Send }): ReactNode => {
  const myTurn = view.turn === myId;
  const find = (name: Card["name"]) => view.self?.hand.find((card) => card.name === name);

  if (view.phase === "waiting-for-action") {
    return myTurn ? (
      <Button onClick={() => send({ type: "draw-card" })}>Draw a card</Button>
    ) : (
      <Idle turn={view.turn} />
    );
  }
  if (view.phase === "nope-window") {
    const nope = find("nope");
    return (
      <div className="flex gap-2">
        {nope ? (
          <Button variant="ghost" onClick={() => send({ type: "nope", card: nope.id })}>
            Nope!
          </Button>
        ) : null}
        <Button variant="ghost" onClick={() => send({ type: "pass-nope" })}>
          Pass
        </Button>
      </div>
    );
  }
  if (view.phase === "defusing" && myTurn) {
    const defuse = find("defuse");
    return defuse ? (
      <Button onClick={() => send({ type: "play-defuse", card: defuse.id })}>
        Defuse the kitten!
      </Button>
    ) : (
      <span className="text-2xl">💥</span>
    );
  }
  if (view.phase === "inserting-exploding-kitten" && myTurn) {
    return (
      <Button onClick={() => send({ type: "insert-exploding-kitten", position: 0 })}>
        Slip the kitten back on top
      </Button>
    );
  }
  if (view.phase === "awaiting-favor" && view.awaitingFrom === myId) {
    const card = view.self?.hand[0];
    return card ? (
      <Button onClick={() => send({ type: "give-card", card: card.id })}>Give a card</Button>
    ) : null;
  }
  return <Idle turn={view.turn} />;
};

const Idle = ({ turn }: { turn: string }) => (
  <p className="text-white/50 text-sm">
    Waiting for <span className="text-white">{short(turn)}</span>…
  </p>
);

export const Match = () => {
  const me = useQuery({ queryKey: ["me"], queryFn: api.me });
  const view = useMatchStore((store) => store.view);
  const matchId = useMatchStore((store) => store.matchId);
  const lastError = useMatchStore((store) => store.lastError);
  const peek = useMatchStore((store) => store.peek);
  const setPeek = useMatchStore((store) => store.setPeek);
  const { send: rawSend } = useGameSocket();

  if (me.isError) return <Navigate to="/" replace />;
  if (!view || !matchId || !me.data) return <Centered>Loading match…</Centered>;

  const myId = me.data.id;
  const send: Send = (command) => rawSend(matchId, command);

  if (view.phase === "game-over") {
    const won = view.winner === myId;
    return (
      <Centered>
        <h1 className="text-4xl font-extrabold">{won ? "You win! 🎉" : "You exploded ☠"}</h1>
        <Link to="/play">
          <Button>Play again</Button>
        </Link>
      </Centered>
    );
  }

  return (
    <main className="min-h-screen p-4 flex flex-col gap-6 max-w-3xl mx-auto">
      {peek ? (
        <div className="fixed inset-x-0 top-4 mx-auto w-fit z-10 bg-black/85 rounded-xl p-3 flex flex-col items-center gap-2 shadow-xl">
          <div className="text-xs text-white/60">Top of the deck (you see the future)</div>
          <div className="flex gap-2">
            {peek.map((card, index) => (
              <div
                key={card.id}
                className="w-12 h-16 rounded bg-amber-100 text-black text-[9px] grid place-items-center p-1 text-center"
              >
                {index + 1}. {card.name}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPeek(undefined)}
            className="text-xs text-emerald-400"
          >
            Got it
          </button>
        </div>
      ) : null}

      <div className="flex gap-3 flex-wrap">
        {view.opponents.map((opponent) => (
          <div
            key={opponent.id}
            className={`rounded-lg px-3 py-2 text-sm ${
              view.turn === opponent.id ? "bg-emerald-500/20 ring-1 ring-emerald-400" : "bg-white/5"
            }`}
          >
            <div className="font-medium">
              {short(opponent.id)}
              {view.out.includes(opponent.id) ? " ☠" : ""}
            </div>
            <div className="text-white/50">{opponent.handCount} cards</div>
          </div>
        ))}
      </div>

      <div className="flex-1 grid place-items-center gap-4">
        <div className="flex items-end gap-6">
          <div className="text-center">
            <div className="w-20 h-28 rounded-xl bg-indigo-600 grid place-items-center text-2xl font-bold shadow-lg">
              {view.drawPileCount}
            </div>
            <div className="text-xs text-white/40 mt-1">draw</div>
          </div>
          <div className="text-center">
            <div className="w-20 h-28 rounded-xl bg-white/10 grid place-items-center text-[10px] text-white/70 text-center p-1">
              {view.discardTop?.name ?? "empty"}
            </div>
            <div className="text-xs text-white/40 mt-1">discard</div>
          </div>
        </div>
        <Prompt view={view} myId={myId} send={send} />
        {lastError ? <p className="text-red-400 text-sm">⚠ {lastError}</p> : null}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {view.self?.hand.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => playFromHand(view, card, myId, send)}
            className="w-16 h-24 rounded-lg bg-amber-100 text-black text-[10px] font-semibold grid place-items-center p-1 text-center hover:-translate-y-2 transition"
          >
            {card.name}
          </button>
        ))}
      </div>
    </main>
  );
};
