import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";

export function setupProjectDir() {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), `project-${uuidv4()}-`)
  );
  const cruftJsonContent = {
    template: "https://github.com/dgrah50/live-template-vite",
    commit: "8c95c7af45e94374df8c200ab8b87ab63aab79e2",
    context: {
      nunjucks: {
        _template: "https://github.com/dgrah50/live-template-vite",
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
