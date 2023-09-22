import {useSelector} from "react-redux";

import {useDispatch} from "@app/store";

import * as selectors from "./selectors";
import * as actions from "./actions";

export const useModal = () => {
  const dispatch = useDispatch();

  const isOpen = useSelector(selectors.isPreferencesModalOpen);

  const open = () => {
    dispatch(
      actions.setIsPreferencesModalOpen({
        isOpen: true,
      }),
    );
  };

  const close = () => {
    dispatch(
      actions.setIsPreferencesModalOpen({
        isOpen: false,
      }),
    );
  };

  return {isOpen, open, close};
};
