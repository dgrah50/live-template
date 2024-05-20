import * as fs from "fs";
import * as path from "path";
import { setupProjectDir } from "./setupProjectDir";
import { link } from "../src/commands/link";
import { expect, test } from "bun:test";

test("link project", async () => {
  const projectDir = setupProjectDir();
  const templateGitUrl = "https://github.com/user/template.git";
  const cruftFilePath = path.join(projectDir, ".cruft.json");

  if (fs.existsSync(cruftFilePath)) {
    fs.unlinkSync(cruftFilePath);
  }

  await link(templateGitUrl, { projectDir });

  expect(fs.existsSync(cruftFilePath)).toBe(true);
});
