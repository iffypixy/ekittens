import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.ts";

export const Leaderboard = () => {
  const board = useQuery({ queryKey: ["leaderboard"], queryFn: api.leaderboard });

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <Link to="/" className="text-white/40 text-sm hover:text-white">
          Back
        </Link>
      </div>
      <ol className="flex flex-col gap-2">
        {(board.data?.entries ?? []).map((entry, index) => (
          <li
            key={entry.userId}
            className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-2"
          >
            <span>
              <span className="text-white/40 mr-2">#{index + 1}</span>
              {entry.userId}
            </span>
            <span className="text-emerald-400 font-semibold">{Math.round(entry.ordinal)}</span>
          </li>
        ))}
        {board.data?.entries.length === 0 ? (
          <p className="text-white/40 text-center py-8">No ranked games yet.</p>
        ) : null}
      </ol>
    </main>
  );
};
