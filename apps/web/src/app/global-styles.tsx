import React from "react";
import {GlobalStyles as MUIGlobalStyles, css, Theme} from "@mui/material";

import MiriamLibreRegular from "@shared/assets/fonts/MiriamLibre-Regular.woff2";
import MiriamLibreBold from "@shared/assets/fonts/MiriamLibre-Bold.woff2";
import BungeeRegular from "@shared/assets/fonts/Bungee-Regular.woff2";
import bglight from "@shared/assets/bg-light.svg?url";
import bgdark from "@shared/assets/bg-dark.svg?url";

const normalized = css`
  html {
    line-height: 1.15;
    -webkit-text-size-adjust: 100%;
  }

  body {
    margin: 0;
  }

  main {
    display: block;
  }

  h1 {
    font-size: 2em;
    margin: 0.67em 0;
  }

  hr {
    box-sizing: content-box;
    height: 0;
    overflow: visible;
  }

  pre {
    font-family: monospace, monospace;
    font-size: 1em;
  }

  a {
    background-color: transparent;
  }

  abbr[title] {
    border-bottom: none;
    text-decoration: underline;
    text-decoration: underline dotted;
  }

  b,
  strong {
    font-weight: bolder;
  }

  code,
  kbd,
  samp {
    font-family: monospace, monospace;
    font-size: 1em;
  }

  small {
    font-size: 80%;
  }

  sub,
  sup {
    font-size: 75%;
    line-height: 0;
    position: relative;
    vertical-align: baseline;
  }

  sub {
    bottom: -0.25em;
  }

  sup {
    top: -0.5em;
  }

  img {
    border-style: none;
  }

  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: inherit;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
  }

  button,
  input {
    overflow: visible;
  }

  button,
  select {
    text-transform: none;
  }

  button,
  [type="button"],
  [type="reset"],
  [type="submit"] {
    -webkit-appearance: button;
  }

  button::-moz-focus-inner,
  [type="button"]::-moz-focus-inner,
  [type="reset"]::-moz-focus-inner,
  [type="submit"]::-moz-focus-inner {
    border-style: none;
    padding: 0;
  }

  button:-moz-focusring,
  [type="button"]:-moz-focusring,
  [type="reset"]:-moz-focusring,
  [type="submit"]:-moz-focusring {
    outline: 1px dotted ButtonText;
  }

  fieldset {
    padding: 0.35em 0.75em 0.625em;
  }

  legend {
    box-sizing: border-box;
    color: inherit;
    display: table;
    max-width: 100%;
    padding: 0;
    white-space: normal;
  }

  progress {
    vertical-align: baseline;
  }

  textarea {
    overflow: auto;
  }

  [type="checkbox"],
  [type="radio"] {
    box-sizing: border-box;
    padding: 0;
  }

  [type="number"]::-webkit-inner-spin-button,
  [type="number"]::-webkit-outer-spin-button {
    height: auto;
  }

  [type="search"] {
    -webkit-appearance: textfield;
    outline-offset: -2px;
  }

  [type="search"]::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-file-upload-button {
    -webkit-appearance: button;
    font: inherit;
  }

  details {
    display: block;
  }

  summary {
    display: list-item;
  }

  template {
    display: none;
  }

  [hidden] {
    display: none;
  }
`;

const styles = (theme: Theme) => css`
  ${normalized}

  html {
    font-size: 62.5%;
    box-sizing: border-box;

    @media (max-width: ${theme.breakpoints.values.xl}px) {
      font-size: 55%;
    }

    @media (max-width: ${theme.breakpoints.values.lg}px) {
      font-size: 45%;
    }

    @media (max-width: ${theme.breakpoints.values.md}px) {
      font-size: 35%;
    }

    @media (max-width: ${theme.breakpoints.values.sm}px) {
      font-size: 25%;
    }

    @media (max-width: ${theme.breakpoints.values.xs}px) {
      font-size: 15%;
    }
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
    margin: 0;
    padding: 0;
  }

  body {
    font-size: 1.6rem;
    font-family: "Miriam Libre", sans-serif;
    font-weight: 400;
    background-image: url(${theme.palette.mode === "light" ? bglight : bgdark});
    background-size: contain;
    background-color: ${theme.palette.background.default};
    animation: fade-in 1s, translate-up 0.25s;
  }

  @font-face {
    font-family: "Miriam Libre";
    font-weight: 400;
    src: url(${MiriamLibreRegular}) format("woff2");
  }

  @font-face {
    font-family: "Miriam Libre";
    font-weight: 700;
    src: url(${MiriamLibreBold}) format("woff2");
  }

  @font-face {
    font-family: "Bungee";
    font-weight: 400;
    src: url(${BungeeRegular}) format("woff2");
  }

  @keyframes fade-in {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  @keyframes translate-up {
    0% {
      transform: translateY(25%);
    }

    100% {
      transform: translateY(0%);
    }
  }

  .SnackbarItem-message {
    font-family: "Bungee", sans-serif;
    font-weight: 400;
  }
`;

export const GlobalStyles: React.FC = () => <MUIGlobalStyles styles={styles} />;
