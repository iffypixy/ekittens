import * as React from "react";
import {css, styled} from "@mui/material";
import {useTranslation, Trans} from "react-i18next";

import {Header, Sidebar} from "@widgets/sidebar";

import {CommonTemplate} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, H5, Text} from "@shared/ui/atoms";

const avatar =
  "https://common-stuff-bucket.s3.eu-central-1.amazonaws.com/photo_2021-12-21_18-12-49.jpg";

export const AboutPage: React.FC = () => {
  const {t} = useTranslation("about");

  return (
    <>
      <Sidebar.Navigational />
      <Sidebar.Social />

      <CommonTemplate>
        <Header>{t("header")}</Header>

        <Layout.Col w="100%" gap={5}>
          <Layout.Col w="50%" gap={2}>
            <Description>
              <Trans
                ns="about"
                i18nKey="description1"
                components={[
                  <Bold key="ekittens-bold" />,
                  <NotEssential key="exploding-kitten-not-essential" />,
                ]}
              />
            </Description>

            <Description>{t("description2")}</Description>
          </Layout.Col>

          <Layout.Row gap={2}>
            <Avatar size={15} src={avatar} />

            <Layout.Col justify="space-between" py={1}>
              <Layout.Col gap={1}>
                <H5>ansat euler</H5>
                <Job>{t("development")}</Job>
              </Layout.Col>

              <Layout.Col gap={1}>
                <Contact
                  href="https://twitter.com/iffypixy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  twitter
                </Contact>
                <Contact
                  href="https://github.com/iffypixy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github
                </Contact>
              </Layout.Col>
            </Layout.Col>
          </Layout.Row>
        </Layout.Col>
      </CommonTemplate>
    </>
  );
};

interface DescriptionStyledProps {
  bold?: boolean;
}

const Description = styled(Text)<DescriptionStyledProps>`
  font-weight: 400;
  text-transform: lowercase;
  font-size: 1.6rem;
  line-height: 1.5;

  ${({bold}) =>
    bold &&
    css`
      font-weight: 700;
    `}
`;

const Bold = styled("p")`
  font-weight: 700;
  display: inline;
`;

const NotEssential = styled("p")`
  color: ${({theme}) => theme.palette.text.secondary};
  font-weight: 400;
  display: inline;
`;

const Job = styled(Text)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const Contact = styled("a")`
  color: ${({theme}) => theme.palette.primary.main};
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
`;
