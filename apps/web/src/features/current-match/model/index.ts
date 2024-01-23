import {store} from "./store";
import * as selectors from "./selectors";
import * as hooks from "./hooks";
import * as actions from "./actions";

export const model = {store, selectors, actions, ...hooks};
