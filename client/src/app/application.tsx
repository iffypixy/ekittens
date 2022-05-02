import * as React from "react";

import {Routes} from "@pages/routes";
import {GlobalStyles} from "./global-styles";

const styles = <GlobalStyles />;

export const App: React.FC = () => (
  <>
    {styles}
    <Routes />
  </>
);
