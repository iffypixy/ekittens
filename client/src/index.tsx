import * as React from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";

import {App} from "@app/application";

const element = document.getElementById("root") as Element;

const root = createRoot(element);

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
