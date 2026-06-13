import { useQuery } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";
import { api } from "../lib/api.ts";
import { Home } from "../pages/home.tsx";
import { Leaderboard } from "../pages/leaderboard.tsx";
import { Match } from "../pages/match.tsx";
import { Play } from "../pages/play.tsx";
import { SocketProvider } from "./socket.tsx";

export const App = () => {
  const me = useQuery({ queryKey: ["me"], queryFn: api.me });

  return (
    <SocketProvider enabled={me.data !== undefined}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/match/:id" element={<Match />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </SocketProvider>
  );
};
