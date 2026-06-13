import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type InputHTMLAttributes, type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.ts";
import { Button } from "../ui/Button.tsx";

const Shell = ({ children }: { children: ReactNode }) => (
  <main className="min-h-screen grid place-items-center p-6">
    <div className="w-full max-w-md flex flex-col gap-6">{children}</div>
  </main>
);

const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-emerald-400"
    {...props}
  />
);

export const Home = () => {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: api.me });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["me"] });
  const logout = useMutation({ mutationFn: api.logout, onSuccess: refresh });

  if (me.data) {
    return (
      <Shell>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Exploding Kittens</h1>
          <p className="text-white/50 mt-1">
            Signed in as <span className="text-white">{me.data.handle}</span>
            {me.data.isGuest ? " · guest" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/play">
            <Button>Play</Button>
          </Link>
          <Link to="/leaderboard">
            <Button variant="ghost">Leaderboard</Button>
          </Link>
          <Button variant="ghost" onClick={() => logout.mutate()}>
            Log out
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <AuthPanel onAuthed={refresh} />
    </Shell>
  );
};

const AuthPanel = ({ onAuthed }: { onAuthed: () => void }) => {
  const [handle, setHandle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const guest = useMutation({
    mutationFn: () => api.guest(handle || "Player"),
    onSuccess: onAuthed,
  });
  const login = useMutation({
    mutationFn: () => api.login(username, password),
    onSuccess: onAuthed,
  });
  const register = useMutation({
    mutationFn: () => api.register(username, password, handle || undefined),
    onSuccess: onAuthed,
  });

  const error = guest.error ?? login.error ?? register.error;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-4xl font-extrabold tracking-tight text-center">Exploding Kittens</h1>

      <div className="flex flex-col gap-2">
        <Input
          placeholder="Display name"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <Button onClick={() => guest.mutate()}>Play as guest</Button>
      </div>

      <div className="text-center text-white/30 text-xs">or with an account</div>

      <div className="flex flex-col gap-2">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => login.mutate()}>
            Log in
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => register.mutate()}>
            Register
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-red-400 text-sm text-center">Something went wrong. Try again.</p>
      ) : null}
    </div>
  );
};
