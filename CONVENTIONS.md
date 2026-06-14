# Conventions

1. Schema is the source of truth. Define data once as a schema and infer types from it; never hand-write a type a schema could derive.
2. Parse at the boundary, trust within. Everything external (network, env, storage, input, responses) enters through a schema parse, and past that edge the core handles only typed, trusted data.
3. Make illegal states unrepresentable. Prefer discriminated unions over combinations of optional fields and booleans; if a state cannot exist, the type must not allow it.
4. Brand meaningful primitives. Give a domain value its own type rather than a bare primitive: `UserId`, not `string`.
5. Default to immutable. Prefer `readonly` data and model change as new values rather than mutation.
6. Errors are values. Return a `Result` at fallible boundaries and reserve `throw` for the truly unrecoverable.
7. Funnel try/catch through a single owned helper, `tc`, rather than scattering raw try/catch blocks.
8. Write error messages in lowercase, with no trailing period, and name what failed.
9. Match exhaustively. Use `ts-pattern` with `.exhaustive()` so the compiler proves every case is handled, and never rely on a silent default branch.
10. Assert your invariants. Guard assumptions with assertions that fail loudly and early.
11. Structure by domain, not by technical role. Keep vertical slices in `modules/`, each owning its types, logic, and data access, instead of splitting code into controller, service, and model layers.
12. Keep shared, domain-agnostic primitives in `lib/`.
13. Own what is small. If a few lines can replace a dependency, write them; every dependency is weight, surface area, and someone else's taste.
14. Make every file name a promise about its contents. Group by capability, like `async.ts` or `result.ts`, and never create a `utils.ts`, `helpers.ts`, or any other dumping ground.
15. Keep surfaces narrow and explicit. Export only what is used, and add no speculative parameters or options kept for later.
16. Stay flat. Prefer shallow directory trees, shallow control flow, and early returns, since breadth reads more easily than depth.
17. Functions first, classes only for state. Use pure functions and plain data by default, and reach for a class only when identity or a mutable lifecycle is the real model. Never fight the language.
18. Keep side effects at the edges. Hold logic pure and testable, and let IO live at the boundary.
19. Do each thing one way. Favor consistency over local cleverness, so a reader can predict the next file from the last.
20. Comment the why, never the what. The code already shows what it does, so comments carry only rationale, links, and gotchas; if code needs a comment just to be understood, rewrite it first.
21. No floating promises. Await every async path or handle it explicitly.
22. Test the contract, not the implementation, so refactors stay free.
23. Type the contract end to end. Share or infer types across the client and server so the wire is checked by the compiler, not duplicated by hand.
24. Let context carry meaning. Scale a name to its scope: a one-letter binding (`x`) fits a tight closure. Never restate what the surrounding scope or namespace already makes clear.
