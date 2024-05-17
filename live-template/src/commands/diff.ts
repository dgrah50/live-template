import * as fs from "fs";
import * as path from "path";
import simpleGit from "simple-git";

export async function diff(
  projectDir: string,
  exitCode: boolean,
  checkout: string | null
): Promise<void> {
  const cruftFilePath = path.join(projectDir, ".cruft.json");
  if (!fs.existsSync(cruftFilePath)) {
    console.error("No .cruft.json file found!");
    process.exit(1);
  }

  const cruftState = JSON.parse(fs.readFileSync(cruftFilePath, "utf8"));

  const git = simpleGit();
  await git.clone(cruftState.template, "tmp-repo", { "--depth": "1" });
  await git.cwd("tmp-repo");

  if (checkout) {
    await git.checkout(checkout);
  }

  const lastCommit = (await git.log(["-n", "1"])).latest?.hash;
  if (lastCommit === undefined) {
    throw new Error("No commits found in the template repository");
  }

  console.log(`Diffing project with template at commit ${lastCommit}...`);

  const baseCommit = cruftState.commit;

  // Change directory to projectDir
  await git.cwd(projectDir);
  const currentCommit = (await git.log(["-n", "1"])).latest?.hash;
  if (currentCommit === undefined) {
    throw new Error("No commits found in the project directory");
  }

  // Change back to tmp-repo
  await git.cwd("tmp-repo");
  await git.raw(["fetch", path.resolve(projectDir), currentCommit]);
  const mergeBaseCommit = (
    await git.raw(["merge-base", baseCommit, currentCommit])
  ).trim();

  // Checkout branches for the merge
  await git.checkout(baseCommit);
  await git.checkoutLocalBranch("base-branch");

  await git.checkout(currentCommit);
  await git.checkoutLocalBranch("current-branch");

  await git.checkout(lastCommit);
  await git.checkoutLocalBranch("target-branch");

  // Perform the three-way merge
  try {
    await git.mergeFromTo("base-branch", "current-branch", [
      "-m",
      "Merging current changes",
    ]);
    await git.mergeFromTo("current-branch", "target-branch", [
      "-m",
      "Merging target changes",
    ]);
  } catch (e) {
    console.error("Merge conflicts detected");
    console.error(e);
    process.exit(1);
  }

  // Display the merge result
  const mergeDiffResult = await git.diff(["HEAD"]);
  console.log(mergeDiffResult);

  if (exitCode && mergeDiffResult) {
    process.exit(1);
  }
}
