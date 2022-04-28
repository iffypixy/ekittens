import * as React from "react";
import {createRoot} from "react-dom/client";

import {App} from "./app";

const element = document.getElementById("root") as Element;

const root = createRoot(element);

root.render(<App />);
