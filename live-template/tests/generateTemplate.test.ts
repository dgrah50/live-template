import * as fs from "fs";
import * as path from "path";
import simpleGit, { type SimpleGit } from "simple-git";

import { expect, test, describe, beforeEach, afterEach, mock } from "bun:test";
import { setupProjectDir } from "./setupProjectDir";
import { displayDiff, getDiff } from "../src/utils/generateTemplate";

const gitClient: SimpleGit = simpleGit();

describe("generateTemplate", () => {
  let projectDir: string;
  let oldDir: string;
  let newDir: string;

  beforeEach(() => {
    projectDir = setupProjectDir();
    oldDir = path.join(projectDir, "old");
    newDir = path.join(projectDir, "new");

    fs.mkdirSync(oldDir, { recursive: true });
    fs.mkdirSync(newDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  test("getDiff with added file", async () => {
    const newFilePath = path.join(newDir, "file");
    fs.writeFileSync(newFilePath, "content");

    const diff = await getDiff(gitClient, oldDir, newDir);

    expect(diff).toContain("diff --git");
    expect(diff).toContain("file");
  });

  test("getDiff with deleted file", async () => {
    const oldFilePath = path.join(oldDir, "file");
    fs.writeFileSync(oldFilePath, "content");

    const diff = await getDiff(gitClient, oldDir, newDir);

    await displayDiff(gitClient, oldDir, newDir);

    expect(diff).toContain("diff --git");
    expect(diff).toContain("file");
  });

  test("displayDiff logs the diff", async () => {
    console.log = mock();

    const newFilePath = path.join(newDir, "file");
    fs.writeFileSync(newFilePath, "content");

    await displayDiff(gitClient, oldDir, newDir);

    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("diff --git")
    );
  });
});
