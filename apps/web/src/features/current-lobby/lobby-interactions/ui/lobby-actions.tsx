import React from "react";
import {useNavigate} from "react-router-dom";
import {Popover, styled} from "@mui/material";
import {useTranslation} from "react-i18next";

import {currentLobbyModel} from "@features/current-lobby";
import {PreferencesModal, preferencesModel} from "@features/preferences";
import {useDispatch} from "@app/store";

import {Icon} from "@shared/ui/icons";
import {Actions} from "@shared/ui/molecules";
import {Text} from "@shared/ui/atoms";

import {model} from "../model";

export const LobbyActions: React.FC = () => {
  const {t} = useTranslation("common");

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const lobby = currentLobbyModel.useLobby()!;

  const {open: openPreferencesModal} = preferencesModel.useModal();

  const [anchor, setAnchor] = React.useState<SVGElement | null>(null);

  const handleClick = (event: React.MouseEvent<SVGElement>) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleLeaveButtonClick = () => {
    dispatch(model.actions.leaveLobby({lobbyId: lobby.id}))
      .unwrap()
      .then(() => {
        dispatch(currentLobbyModel.actions.setLobby({lobby: null}));

        navigate("/");
      });
  };

  return (
    <>
      <PreferencesModal />
      <BurgerIcon role="button" onClick={handleClick} />

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{horizontal: "left", vertical: "bottom"}}
      >
        <Actions.List>
          <SettingsAction
            icon={<SettingsIcon />}
            onClick={openPreferencesModal}
          >
            <SettingsText>{t("w.preferences")}</SettingsText>
          </SettingsAction>

          <Actions.Item icon={<CrossIcon />} onClick={handleLeaveButtonClick}>
            <Text color="error" weight={700} transform="uppercase">
              leave
            </Text>
          </Actions.Item>
        </Actions.List>
      </Popover>
    </>
  );
};

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
`;

const BurgerIcon = styled(Icon.Burger)`
  width: 4rem;
  fill: ${({theme}) => theme.palette.text.primary};
  cursor: pointer;
`;

const SettingsText = styled(Text)`
  color: currentColor;
  font-weight: 700;
  font-size: 1.4rem;
  text-transform: uppercase;
`;

const SettingsAction = styled(Actions.Item)`
  color: ${({theme}) => theme.palette.text.primary};

  &:hover {
    color: ${({theme}) => theme.palette.background.default};
  }
`;

const SettingsIcon = styled(Icon.Settings)`
  width: 2rem;
  fill: currentColor;
`;
