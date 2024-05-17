import * as fs from "fs";
import * as path from "path";
import { expect, test } from "bun:test";

export function getDiff(repo0: string, repo1: string): string {
  const repo0Files = fs.readdirSync(repo0);
  const repo1Files = fs.readdirSync(repo1);

  const diff = repo1Files
    .filter((file) => !repo0Files.includes(file))
    .map(
      (file) =>
        `diff --git ${path.join("upstream-template-old", file)} ${path.join(
          "upstream-template-new",
          file
        )}`
    )
    .join("\n");

  return diff;
}

test("getDiff with added file", () => {
  const repo0 = path.join(__dirname, "repo0");
  const repo1 = path.join(__dirname, "repo1");

  if (!fs.existsSync(repo0)) {
    fs.mkdirSync(repo0);
  }

  if (!fs.existsSync(repo1)) {
    fs.mkdirSync(repo1);
  }

  fs.writeFileSync(path.join(repo1, "file"), "");

  const diff = getDiff(repo0, repo1);
  expect(diff).toContain(
    "diff --git upstream-template-old/file upstream-template-new/file"
  );
});
