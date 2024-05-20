import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { dummyCruft } from "./dummyCruft";

export function setupProjectDir() {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `project-${uuidv4()}-`)
  );

  fs.writeFileSync(
    path.join(tempDir, ".cruft.json"),
    JSON.stringify(dummyCruft, null, 2)
  );

  return tempDir;
}
