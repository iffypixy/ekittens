import React from "react";
import {Modal as MUIModal, styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {useDispatch} from "@app/store";

import {Button, H3, H6, Text} from "@shared/ui/atoms";
import {Layout} from "@shared/lib/layout";
import {themingModel, Theme} from "@shared/lib/theming";
import {langs} from "@shared/lib/i18n";
import {Nullable} from "@shared/lib/typings";

import {model} from "../model";

export const PreferencesModal: React.FC = () => {
  const {t, i18n} = useTranslation("common");

  const dispatch = useDispatch();

  const theme = themingModel.useTheme();

  const {isOpen, close} = model.useModal();

  const toggleTheme = () => {
    let updated: Nullable<Theme> = null;

    if (theme === "dark") updated = "light";
    else if (theme === "light") updated = "dark";

    if (updated) {
      dispatch(themingModel.actions.setTheme(updated));

      localStorage.setItem("theme", updated);
    }
  };

  const changeLanguage = () => {
    const current = langs.findIndex((lang) => lang === i18n.language);

    const next = langs[current + 1] || langs[0];

    i18n.changeLanguage(next);
  };

  return (
    <Modal open={isOpen} disableAutoFocus={true} onClose={() => close()}>
      <Center>
        <Layout.Col gap={4}>
          <Title>{t("w.preferences")}</Title>

          <Layout.Col gap={3}>
            <Layout.Col gap={2}>
              <Category>{t("w.global")}</Category>

              <Layout.Col gap={1}>
                <Layout.Row align="center" gap={2}>
                  <Preference>{t("w.theme-mode")}: </Preference>
                  <Value onClick={toggleTheme}>
                    {theme === "light" ? t("w.light") : t("w.dark")}
                  </Value>
                </Layout.Row>

                <Layout.Row align="center" gap={2}>
                  <Preference>{t("w.language")}:</Preference>
                  <Value onClick={changeLanguage}>{i18n.language}</Value>
                </Layout.Row>
              </Layout.Col>
            </Layout.Col>
          </Layout.Col>

          <CloseButton color="info" variant="contained" onClick={() => close()}>
            {t("w.close")}
          </CloseButton>
        </Layout.Col>
      </Center>
    </Modal>
  );
};

const Modal = styled(MUIModal)`
  & .MuiBackdrop-root {
    background-color: ${({theme}) => theme.palette.background.default};
    opacity: 0.85 !important;
  }

  outline: none;
`;

const Center = styled("div")`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Title = styled(H3)`
  color: ${({theme}) => theme.palette.background.default};
  width: fit-content;
  background-color: ${({theme}) => theme.palette.text.primary};
  padding: 0.2rem 0.5rem;
`;

const Category = styled(H6)`
  color: ${({theme}) => theme.palette.background.default};
  width: fit-content;
  background-color: ${({theme}) => theme.palette.text.primary};
  padding: 0.2rem 0.5rem;
`;

const Preference = styled(Text)`
  font-weight: 700;
  font-size: 1.4rem;
  width: 15rem;
  text-transform: uppercase;
`;

const Value = styled(Text)`
  font-size: 1.3rem;
  text-transform: uppercase;
  border-bottom: 1px solid ${({theme}) => theme.palette.text.primary};
  cursor: pointer;
  transition: 0.2s linear;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &:hover {
    color: ${({theme}) => theme.palette.primary.main};
    border-color: ${({theme}) => theme.palette.primary.main};
  }
`;

const CloseButton = styled(Button)`
  border-radius: 0;
`;
