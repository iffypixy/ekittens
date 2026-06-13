import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API_TARGET = "http://localhost:8000";
const apiProxy = { target: API_TARGET, changeOrigin: true } as const;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/auth": apiProxy,
      "/users": apiProxy,
      "/friends": apiProxy,
      "/leaderboard": apiProxy,
      "/matchmaking": apiProxy,
      "/health": apiProxy,
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
});
