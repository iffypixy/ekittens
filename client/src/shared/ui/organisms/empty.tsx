import * as React from "react";
import {styled} from "@mui/material";

import {Layout} from "@shared/lib/layout";
import {H6, Text} from "@shared/ui/atoms";

interface EmptyProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  withSubtitle?: boolean;
}

export const Empty: React.FC<EmptyProps> = ({
  icon,
  title,
  subtitle,
  withSubtitle,
}) => (
  <Wrapper gap={2}>
    {icon}

    <Layout.Col gap={1}>
      <H6>{title}</H6>

      {withSubtitle && <Subtitle>{subtitle}</Subtitle>}
    </Layout.Col>
  </Wrapper>
);

const Wrapper = styled(Layout.Col)`
  justify-content: center;
  align-items: center;
  text-align: center;
`;

const Subtitle = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: uppercase;
`;
