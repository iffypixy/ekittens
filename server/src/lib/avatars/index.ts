import * as fs from "fs";
import * as process from "process";
import * as path from "path";

export let avatars: Buffer[] = [];

const dir = path.join(process.cwd(), "./src/lib/avatars/assets");

Promise.all([
  fs.readFileSync(path.join(dir, "1.png")),
  fs.readFileSync(path.join(dir, "2.png")),
  fs.readFileSync(path.join(dir, "3.png")),
  fs.readFileSync(path.join(dir, "4.png")),
  fs.readFileSync(path.join(dir, "5.png")),
]).then((buffers) => {
  avatars = buffers;
});
