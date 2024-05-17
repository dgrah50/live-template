import * as fs from "fs";
import * as path from "path";
import { diff } from "../src/commands/diff";
import { expect, test } from "bun:test";
import { setupProjectDir } from "./conftest";

test("diff with no .cruft.json", async () => {
  const projectDir = setupProjectDir();
  const cruftFilePath = path.join(projectDir, ".cruft.json");

  if (fs.existsSync(cruftFilePath)) {
    fs.unlinkSync(cruftFilePath);
  }

  await expect(diff(projectDir, false, null)).rejects.toThrow(
    "No .cruft.json file found!"
  );
});
