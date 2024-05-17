import * as fs from "fs";
import * as path from "path";
import { update } from "../src/commands/update";
import { expect, test } from "bun:test";
import { setupProjectDir } from "./conftest";

test("update project", async () => {
  const projectDir = setupProjectDir();
  const cruftFilePath = path.join(projectDir, ".cruft.json");

  const cruftState = {
    template: "https://github.com/user/repo.git",
    commit: "abc123",
  };

  fs.writeFileSync(cruftFilePath, JSON.stringify(cruftState, null, 2));

  await update({ projectDir });

  expect(fs.existsSync(cruftFilePath)).toBe(true);
});
