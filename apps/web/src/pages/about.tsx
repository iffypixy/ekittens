import {ReactNode} from "react";
import {css, styled} from "@mui/material";
import {useTranslation, Trans} from "react-i18next";

import {Header, Sidebar} from "@widgets/sidebar";
import {CommonTemplate} from "@shared/ui/templates";
import {Layout} from "@shared/lib/layout";
import {Avatar, H5, Text} from "@shared/ui/atoms";
import avatar from "@shared/assets/avatar.png";
import {Icon} from "@shared/ui/icons";

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

            <Description2>{t("description2")}</Description2>
          </Layout.Col>

          <Layout.Row gap={2}>
            <MyAvatar size={15} src={avatar} />

            <Layout.Col justify="space-between" py={1}>
              <Layout.Col gap={1}>
                <H5>Ansat Euler</H5>
                <Job>{t("development")}</Job>
              </Layout.Col>

              <Layout.Col gap={0.75}>
                <SocialContact icon={<Linkedin />} name="linkedin" />
                <SocialContact icon={<Github />} name="github" />
                <SocialContact icon={<Twitter />} name="twitter" />
              </Layout.Col>
            </Layout.Col>
          </Layout.Row>
        </Layout.Col>
      </CommonTemplate>
    </>
  );
};

interface SocialContactProps {
  icon: ReactNode;
  name: string;
}

const SocialContact: React.FC<SocialContactProps> = ({icon, name}) => (
  <Contact
    href="https://github.com/iffypixy"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Layout.Row gap={0.75} align="center">
      {icon}

      <span>{name}</span>
    </Layout.Row>
  </Contact>
);

interface DescriptionStyledProps {
  bold?: boolean;
}

const Description = styled(Text)<DescriptionStyledProps>`
  font-weight: 400;
  font-size: 1.6rem;
  line-height: 1.5;

  ${({bold}) =>
    bold &&
    css`
      font-weight: 700;
    `}
`;

const Description2 = styled(Description)`
  color: ${({theme}) => theme.palette.text.secondary};
  white-space: break-spaces;
`;

const Twitter = styled(Icon.Social.Twitter)`
  width: 1.4rem;
  height: 1.4rem;
  fill: ${({theme}) => theme.palette.primary.main};
`;

const Github = styled(Icon.Social.Github)`
  width: 1.4rem;
  height: 1.4rem;
  fill: ${({theme}) => theme.palette.primary.main};
`;

const Linkedin = styled(Icon.Social.Linkedin)`
  width: 1.4rem;
  height: 1.4rem;
  fill: ${({theme}) => theme.palette.primary.main};
`;

const Bold = styled("p")`
  font-weight: 700;
  display: inline;
  font-style: italic;
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
  font-size: 1.2rem;
  font-weight: 700;
  text-transform: uppercase;
  text-decoration: none;
`;

const MyAvatar = styled(Avatar)`
  background-color: ${({theme}) => theme.palette.background.paper};
  border: 1px solid ${({theme}) => theme.palette.text.primary};
  border-radius: 50%;
`;
