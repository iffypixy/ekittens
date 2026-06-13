export interface PublicUser {
  id: string;
  handle: string;
  username: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
}

export interface Standing {
  userId: string;
  mu: number;
  sigma: number;
  ordinal: number;
  gamesPlayed: number;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ code: "internal" }))) as { code?: string };
    throw new ApiError(response.status, body.code ?? "internal");
  }
  return response.json() as Promise<T>;
};

const post = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(
    path,
    body === undefined
      ? { method: "POST" }
      : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
  );

export const api = {
  guest: (handle: string) => post<PublicUser>("/auth/guest", { handle }),
  login: (username: string, password: string) =>
    post<PublicUser>("/auth/login", { username, password }),
  register: (username: string, password: string, handle?: string) =>
    post<PublicUser>("/auth/register", { username, password, handle }),
  logout: () => post<{ ok: true }>("/auth/logout"),
  me: () => request<PublicUser>("/users/me"),
  leaderboard: () => request<{ entries: Standing[] }>("/leaderboard"),
  joinQueue: () => post<{ ok: true }>("/matchmaking/join"),
  leaveQueue: () => post<{ ok: true }>("/matchmaking/leave"),
};
