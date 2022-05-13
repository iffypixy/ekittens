import * as React from "react";

import {
  MainTemplate,
  CenterTemplate,
  FullScreenTemplate,
} from "@shared/ui/templates";

export const HomePage: React.FC = () => (
  <MainTemplate>
    <FullScreenTemplate>
      <CenterTemplate>
        <></>
      </CenterTemplate>
    </FullScreenTemplate>
  </MainTemplate>
);
