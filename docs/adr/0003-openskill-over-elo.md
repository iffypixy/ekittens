# 3. OpenSkill over ELO for ratings

Status: accepted

## Context

Exploding Kittens is a 2–5 player free-for-all that produces a full finishing
order. ELO is fundamentally a two-player model; applying it to a 5-way match
needs hacky pairwise expansions and ranks players poorly.

## Decision

Use **OpenSkill** (a Bayesian, FFA-native rating). Each match's finishing order
(winner first) feeds `rate()` directly. We persist mu, sigma, and the
conservative ordinal (mu − 3·sigma); the leaderboard sorts by ordinal.

## Consequences

- Statistically sound multiplayer ratings; new players converge quickly via
  uncertainty.
- Open-source and unpatented (unlike TrueSkill).
- Rating lives in the ratings service's own `player_ratings` table — never a
  column on `users` (one table, one owner).
