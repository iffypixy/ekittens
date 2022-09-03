import {store} from "./store";
import * as selectors from "./selectors";
import * as actions from "./actions";
import * as hooks from "./hooks";

export const model = {store, selectors, actions, ...hooks};
