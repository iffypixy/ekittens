/** A cancelable one-shot timer port, injected so timing is testable (no real clock in tests). */
export type Cancel = () => void;

export interface Scheduler {
  schedule(delayMs: number, fn: () => void): Cancel;
}

export const realScheduler: Scheduler = {
  schedule(delayMs, fn) {
    const timer = setTimeout(fn, delayMs);
    return () => clearTimeout(timer);
  },
};

/** A scheduler whose timers never fire on their own — for deterministic tests. */
export const inertScheduler: Scheduler = {
  schedule: () => () => {},
};
