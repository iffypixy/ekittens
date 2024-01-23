export type MatchModal =
  | "see-the-future"
  | "alter-the-future"
  | "share-the-future"
  | "bury-card"
  | "defuse-exploding-kitten"
  | "insert-exploding-kitten"
  | "insert-imploding-kitten"
  | "mark-card"
  | "select-player"
  | "shared-cards";

export type ModalData<P> = {
  open: boolean;
  payload: P;
};
