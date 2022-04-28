import * as React from "react";

import {GlobalStyles} from "./global-styles";

const styles = <GlobalStyles />;

export const App: React.FC = () => (
  <>
    {styles}
    <h1>Hi!</h1>
  </>
);
