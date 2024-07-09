import {useEffect, useState} from "react";

import {Card} from "@entities/card";
import {Layout} from "@shared/lib/layout";
import {H3, Text} from "@shared/ui/atoms";
import {Center, Fullscreen} from "@shared/ui/templates";

export const DecktopOnlyRestrict: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const adjust = () => {
      const width = window.document.body.clientWidth;
      const minWidth = 1400;

      setShow(width >= minWidth);
    };

    adjust();

    window.addEventListener("resize", adjust);

    return () => {
      window.removeEventListener("resize", adjust);
    };
  }, []);

  if (!show)
    return (
      <Fullscreen>
        <Center>
          <Layout.Row align="center" gap={2}>
            <Card name="nope" />

            <Layout.Col w={30} gap={2}>
              <H3>Resolution not supported</H3>

              <Text emphasis="secondary" transform="lowercase">
                Unfortunately, at the moment, only desktop devices are
                supported. :c
              </Text>
            </Layout.Col>
          </Layout.Row>
        </Center>
      </Fullscreen>
    );

  return children;
};
