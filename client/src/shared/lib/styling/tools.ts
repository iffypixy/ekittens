import {StylingSize} from "./typings";

export const prop = (value: any) => value || "initial";
export const size = (value: StylingSize) =>
  typeof value === "number" ? `${value}rem` : value;
