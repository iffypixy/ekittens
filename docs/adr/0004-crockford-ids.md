# 4. Crockford-Base32 ids as primary keys

Status: accepted

## Context

We want pretty, unambiguous, hard-to-confuse public ids, used uniformly for
every entity. The question was the physical Postgres key strategy.

## Decision

Uniform ~10-char **Crockford Base32** ids (uppercase, no I/L/O/U), generated
app-side, used directly as the Postgres primary key (one id per row),
unique-constrained with bounded retry on the astronomically-rare collision.

## Consequences

- Simple and clear: the public/contract id *is* the key.
- These ids are random (not time-sortable), so at very large scale B-tree insert
  locality suffers. Per Rule 16 we do **not** pre-optimise: an internal
  monotonic surrogate key is the documented path *if* index pain is ever
  profiled. A card game will not hit this.
