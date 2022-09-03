import {useSelector} from "react-redux";

import * as selectors from "./selectors";

export const useTheme = () => useSelector(selectors.theme);
