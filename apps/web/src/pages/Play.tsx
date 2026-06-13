import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.ts";
import { Button } from "../ui/Button.tsx";

export const Play = () => {
  const join = useMutation({ mutationFn: api.joinQueue });
  const searching = join.isPending || join.isSuccess;

  // Leaving the page (without a match starting) dequeues us.
  useEffect(() => () => void api.leaveQueue().catch(() => {}), []);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <h1 className="text-2xl font-bold">Quick Match</h1>
        {searching ? (
          <p className="text-white/60 animate-pulse">Searching for players…</p>
        ) : (
          <Button onClick={() => join.mutate()}>Find a match</Button>
        )}
        <Link to="/" className="text-white/40 text-sm hover:text-white">
          Back
        </Link>
      </div>
    </main>
  );
};
