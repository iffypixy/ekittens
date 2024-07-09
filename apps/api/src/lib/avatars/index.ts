// import fs from "fs";
// import process from "process";
// import path from "path";

// import {collection} from "./collection";

// const dir = path.join(process.cwd(), "./src/lib/avatars/assets");

// const total = fs.readdirSync(dir).length;

// export const avatars: Buffer[] = Array.from({length: total}).map((_, idx) =>
//   fs.readFileSync(path.join(dir, `${idx + 1}.png`)),
// );

import {collection} from "./collection";

export const avatars = collection;
