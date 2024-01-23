import {styled, css} from "@mui/material";

export interface LayoutProps {
  w?: string | number;
  h?: string | number;
  justify?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-around"
    | "space-between"
    | "space-evenly"
    | "safe center"
    | "unsafe center";
  align?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  p?: string | number;
  px?: string | number;
  py?: string | number;
  pt?: string | number;
  pb?: string | number;
  pl?: string | number;
  pr?: string | number;
  m?: string | number;
  mx?: string | number;
  my?: string | number;
  mt?: string | number;
  mb?: string | number;
  ml?: string | number;
  mr?: string | number;
  gap?: string | number;
  reverse?: boolean;
}

export const size = (value: any) =>
  typeof value === "number" ? `${value}rem` : value;

const mixin = (props: LayoutProps) =>
  css({
    width: size(props.w),
    height: size(props.h),
    justifyContent: props.justify,
    alignItems: props.align,
    padding: size(props.p),
    paddingLeft: size(props.pl),
    paddingRight: size(props.pr),
    paddingTop: size(props.pt || props.py),
    paddingBottom: size(props.pb || props.py),
    paddingInlineStart: size(props.px),
    paddingInlineEnd: size(props.px),
    margin: size(props.m),
    marginLeft: size(props.ml),
    marginRight: size(props.mr),
    marginBottom: size(props.mb || props.my),
    marginTop: size(props.mt || props.my),
    marginInlineStart: size(props.mx),
    marginInlineEnd: size(props.mx),
  });

const propsNotToForward = [
  "w",
  "h",
  "justify",
  "align",
  "p",
  "px",
  "py",
  "pt",
  "pb",
  "pl",
  "pr",
  "m",
  "mx",
  "my",
  "mt",
  "mb",
  "ml",
  "mr",
  "gap",
  "reverse",
];

const shouldForwardProp = (prop: string) => !propsNotToForward.includes(prop);

const Col = styled("div", {shouldForwardProp})<LayoutProps>`
  display: flex;
  flex-direction: column;

  ${mixin}

  ${(props) => css`
    & > :not(:first-child) {
      margin-top: ${size(props.gap)};
    }
  `}

  ${(props) =>
    props.reverse &&
    css`
      flex-direction: column-reverse;
    `}
`;

const Row = styled("div", {shouldForwardProp})<LayoutProps>`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  ${mixin}

  ${(props) => css`
    & > :not(:first-child) {
      margin-left: ${size(props.gap)};
    }
  `}
  
  ${(props) =>
    props.reverse &&
    css`
      flex-direction: row-reverse;
    `}
`;

export const Layout = {Col, Row};
