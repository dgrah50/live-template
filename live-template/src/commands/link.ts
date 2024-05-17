import * as fs from "fs";
import * as path from "path";
import simpleGit from "simple-git";

export async function link(
  templateGitUrl: string,
  options: any
): Promise<void> {
  const {
    projectDir,
    checkout,
    noInput,
    configFile,
    defaultConfig,
    extraContext,
    directory,
  } = options;

  const cruftFilePath = path.join(projectDir, ".cruft.json");
  if (fs.existsSync(cruftFilePath)) {
    console.error("Cruft file already exists!");
    process.exit(1);
  }

  const git = simpleGit();
  await git.clone(templateGitUrl, "tmp-repo", { "--depth": "1" });
  await git.cwd("tmp-repo");

  if (checkout) {
    await git.checkout(checkout);
  }

  const lastCommit = (await git.log(["-n", "1"])).latest?.hash;

  const context = JSON.parse(extraContext);
  if (!noInput) {
    // Implement prompt for commit hash if needed
  }

  const cruftContent = {
    template: templateGitUrl,
    commit: lastCommit,
    checkout,
    context,
    directory,
  };
  fs.writeFileSync(cruftFilePath, JSON.stringify(cruftContent, null, 2));
}
