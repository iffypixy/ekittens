import {useDispatch} from "@app/store";
import {useSelector} from "react-redux";

import {MatchModal, ModalData} from "../lib/typings";
import * as actions from "./actions";
import * as selectors from "./selectors";

type UseModalReturn<P> = ModalData<P> & {
  close: () => void;
};

export const useModal = <P = void>(modal: MatchModal): UseModalReturn<P> => {
  const dispatch = useDispatch();

  const {open, payload} = useSelector(selectors.modal(modal));

  const close = () =>
    dispatch(
      actions.setModalData({
        modal,
        data: {
          open: false,
          payload: null,
        },
      }),
    );

  return {open, close, payload};
};
