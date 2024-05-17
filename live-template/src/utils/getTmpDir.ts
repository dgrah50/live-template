import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export function getTmpDir(): string {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `project-${uuidv4()}-`)
  );
  const cruftJsonContent = {
    template: "https://github.com/user/repo.git",
    commit: "abc123",
    context: {
      nunjucks: {
        _template: "https://github.com/user/repo.git",
      },
    },
    directory: ".",
    checkout: null,
  };
  fs.writeFileSync(
    path.join(tempDir, ".cruft.json"),
    JSON.stringify(cruftJsonContent, null, 2)
  );

  return tempDir;
}
