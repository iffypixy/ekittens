import * as React from "react";

import {userModel} from "@entities/user";
import {interimModel} from "@shared/lib/interim";
import {useDispatch} from "./store";

interface GlobalInitProps {
  children: React.ReactNode;
}

export const GlobalInit: React.FC<GlobalInitProps> = ({children}) => {
  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(userModel.actions.fetchMyMatches());
    dispatch(userModel.actions.fetchMyStats());
    dispatch(userModel.actions.fetchMyFriends())
      .unwrap()
      .then((res) =>
        dispatch(
          interimModel.actions.fetchUserSupplemental({
            ids: res.friends.map((friend) => friend.id),
          }),
        ),
      );
  }, []);

  return <>{children}</>;
};
