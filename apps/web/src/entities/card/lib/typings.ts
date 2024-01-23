export type CardName =
  | "exploding-kitten"
  | "defuse"
  | "attack"
  | "nope"
  | "shuffle"
  | "skip"
  | "see-the-future-3x"
  | "targeted-attack"
  | "alter-the-future-3x"
  | "draw-from-the-bottom"
  | "reverse"
  | "streaking-kitten"
  | "super-skip"
  | "see-the-future-5x"
  | "swap-top-and-bottom"
  | "catomic-bomb"
  | "mark"
  | "bury"
  | "personal-attack"
  | "share-the-future-3x"
  | "imploding-kitten";

export interface CardDetails {
  name: string;
  tone: string;
  description: string;
  image: string;
}

export interface CardUnit {
  id: string;
  name: CardName;
}
