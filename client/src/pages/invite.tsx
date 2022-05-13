import * as React from "react";
import {useParams} from "react-router-dom";

import {
  MainTemplate,
  CenterTemplate,
  FullScreenTemplate,
} from "@shared/ui/templates";

interface InvitePageParams {
  id: string;
}

export const InvitePage: React.FC = () => {
  const params = useParams<Partial<InvitePageParams>>();

  return (
    <MainTemplate>
      <FullScreenTemplate>
        <CenterTemplate>
          <></>
        </CenterTemplate>
      </FullScreenTemplate>
    </MainTemplate>
  );
};
