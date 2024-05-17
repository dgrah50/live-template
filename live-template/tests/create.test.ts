import * as fs from "fs";
import * as path from "path";
import { setupProjectDir } from "./conftest";
import { create } from "../src/commands/create";
import { expect, test } from "bun:test";
import { simpleGit } from "simple-git";
import { getTmpDir } from "../src/utils/getTmpDir";
import { randomUUID } from "crypto";

test("create project", async () => {
  const projectDir = setupProjectDir();

  const templateGitUrl = "https://github.com/dgrah50/live-template-vite";

  const outputDir = path.join(projectDir, "output");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const git = simpleGit({ baseDir: getTmpDir() });

  const PROJECT_NAME = randomUUID();

  await create(templateGitUrl, git, {
    outputDir,
    extraContext: {
      project_name: PROJECT_NAME,
    },
  });

  const readmePath = path.join(outputDir, "README.md");
  expect(fs.existsSync(readmePath)).toBe(true);

  const readmeFile = fs.readFileSync(readmePath, "utf8");
  expect(readmeFile).toContain(
    "This is a example project template that can be generated with live-template"
  );
  expect(readmeFile).toContain(PROJECT_NAME);
});
