import {useSelector} from "react-redux";

import * as selectors from "./selectors";

export const useInterims = () => useSelector(selectors.interims);
