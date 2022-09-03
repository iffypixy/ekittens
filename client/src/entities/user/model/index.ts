import * as actions from "./actions";
import * as selectors from "./selectors";
import * as hooks from "./hooks";
import {store} from "./store";

export const model = {actions, selectors, store, ...hooks};
