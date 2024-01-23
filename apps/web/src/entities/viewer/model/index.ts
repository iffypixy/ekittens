import {store} from "./store";
import * as actions from "./actions";
import * as selectors from "./selectors";
import * as hooks from "./hooks";

export const model = {actions, selectors, store, ...hooks};
