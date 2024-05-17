import * as fs from "fs";
import * as path from "path";
import { expect, test, mock } from "bun:test";
import { check } from "../src/commands/check";
import { setupProjectDir } from "./conftest";
import simpleGit, { type SimpleGit } from "simple-git";

test("check with no .cruft.json", async () => {
  const projectDir = setupProjectDir();
  const cruftFilePath = path.join(projectDir, ".cruft.json");

  if (fs.existsSync(cruftFilePath)) {
    fs.unlinkSync(cruftFilePath);
  }

  const git = {} as unknown as SimpleGit;

  await expect(check(projectDir, null, true, git)).rejects.toThrow(
    "No .cruft.json file found!"
  );
});

test("check with valid .cruft.json and up-to-date template", async () => {
  const projectDir = setupProjectDir();

  const simpleGit = {
    clone: mock(),
    cwd: mock().mockReturnThis(),
    checkout: mock().mockReturnThis(),
    log: mock().mockResolvedValue({
      latest: { hash: "8c95c7af45e94374df8c200ab8b87ab63aab79e2" },
    }),
    raw: mock().mockResolvedValue(""),
  } as unknown as SimpleGit;

  await check(projectDir, null, true, simpleGit);
  // No error means success
});

test("check with non-descendent commit", async () => {
  const projectDir = setupProjectDir();

  const simpleGit = {
    clone: mock(),
    cwd: mock().mockReturnThis(),
    checkout: mock().mockReturnThis(),
    log: mock().mockResolvedValue({
      latest: { hash: "NEW_HASH" },
    }),
    raw: mock().mockImplementation(() => {
      throw new Error("Mocked error");
    }),
  } as unknown as SimpleGit;

  expect(async () => {
    return await check(projectDir, null, false, simpleGit);
  }).toThrow(
    "FAILURE: The old project commit hash is not an ancestor of the current commit hash!"
  );
});
