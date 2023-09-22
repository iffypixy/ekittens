import {store} from "./store";
import * as actions from "./actions";
import * as hooks from "./hooks";
import * as selectors from "./selectors";

export const model = {actions, selectors, store, ...hooks};
