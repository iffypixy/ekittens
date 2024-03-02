import React from "react";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router-dom";
import {Popover, styled} from "@mui/material";

import {useDispatch} from "@app/store";
import {currentMatchModel} from "@features/current-match";
import {PreferencesModal, preferencesModel} from "@features/preferences";

import {Text} from "@shared/ui/atoms";
import {Icon} from "@shared/ui/icons";
import {Actions} from "@shared/ui/molecules";

import {model} from "../model";

export const MatchActions: React.FC = () => {
  const {t} = useTranslation(["common"]);

  const dispatch = useDispatch();

  const match = currentMatchModel.useMatch()!;

  const navigate = useNavigate();

  const {open: openPreferencesModal} = preferencesModel.useModal();

  const [anchor, setAnchor] = React.useState<SVGElement | null>(null);

  const handleClick = (event: React.MouseEvent<SVGElement>) => {
    setAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchor(null);
  };

  const handleLeaveButtonClick = () => {
    const isPlayer = match.as === "player";
    const isSpectator = match.as === "spectator";

    if (isPlayer) {
      dispatch(model.actions.leaveAsPlayer({matchId: match.id}))
        .unwrap()
        .then(() => {
          dispatch(currentMatchModel.actions.setMatch({match: null}));

          navigate("/");
        });
    } else if (isSpectator) {
      dispatch(model.actions.leaveAsSpectator({matchId: match.id}))
        .unwrap()
        .then(() => {
          dispatch(currentMatchModel.actions.setMatch({match: null}));

          navigate("/");
        });
    }
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
            <Text color="error" weight={700} size={1.4} transform="uppercase">
              {t("w.leave")}
            </Text>
          </Actions.Item>
        </Actions.List>
      </Popover>
    </>
  );
};

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

const CrossIcon = styled(Icon.Cross)`
  width: 2rem;
  fill: ${({theme}) => theme.palette.error.main};
`;
