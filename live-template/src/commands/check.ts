import * as path from "path";
import simpleGit, { type SimpleGit } from "simple-git";
import { execSync } from "child_process";
import { parseCruftJson } from "../utils/cruftJson";
import { getTmpDir } from "../utils/getTmpDir";

export async function check(
  projectDir: string,
  checkout: string | null,
  strict: boolean,
  gitClient: SimpleGit
): Promise<void> {
  const cruftState = parseCruftJson(projectDir);

  await gitClient.clone(cruftState.template, "tmp-repo", { "--depth": "1" });
  await gitClient.cwd("tmp-repo");

  if (checkout) {
    await gitClient.checkout(checkout);
  }

  const lastCommit = (await gitClient.log(["-n", "1"])).latest?.hash;
  const currentCommit = cruftState.commit;

  if (strict) {
    if (lastCommit !== currentCommit) {
      throw new Error("FAILURE: Project is not up to date!");
    }
  } else {
    try {
      await gitClient.raw(
        ["merge-base", "--is-ancestor", currentCommit, lastCommit].join(" ")
      );
    } catch (error) {
      throw new Error(
        "FAILURE: The old project commit hash is not an ancestor of the current commit hash!"
      );
    }
  }

  console.log("SUCCESS: Project is up to date.");
}
