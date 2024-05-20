import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as jsonfile from "jsonfile";
import { type SimpleGit } from "simple-git";
import { askQuestions } from "./prompter";
import { getTmpDir } from "./getTmpDir";
import { displayDiff, getDiff } from "./generateTemplate";

export async function generateProjectToDirectory(
  gitClient: SimpleGit,
  templateUrl: string,
  commitHash: string
): Promise<string> {
  const tmpDir = getTmpDir();
  await gitClient.clone(templateUrl, tmpDir, { "--depth": "1" });
  await gitClient.cwd(tmpDir);
  await gitClient.checkout(commitHash);
  return path.resolve(tmpDir);
}
export async function getLastCommitHash(gitClient: SimpleGit): Promise<string> {
  const log = await gitClient.log(["-n", "1"]);
  return log.latest?.hash || "";
}
export function validateExtraContextFile(
  extraContextFile: string,
  outputDir: string
) {
  if (
    path.resolve(extraContextFile) ===
    path.resolve(path.join(outputDir, ".cruft.json"))
  ) {
    throw new Error(
      "The file path given to --variables-to-update-file cannot be the same as the project's cruft file."
    );
  }
}
export function mergeExtraContext(
  extraContextFile: string,
  cruftState: any,
  extraContext?: Record<string, any>
) {
  const extraContextFromFile =
    jsonfile.readFileSync(extraContextFile).context?.cookiecutter || {};
  cruftState.context.cookiecutter = {
    ...cruftState.context.cookiecutter,
    ...extraContextFromFile,
  };
  if (extraContext) {
    Object.assign(cruftState.context.cookiecutter, extraContext);
  }
}
export async function ensureProjectRepoClean(
  gitClient: SimpleGit,
  directory: string,
  allowUntrackedFiles: boolean
) {
  if (!(await isProjectRepoClean(gitClient, directory, allowUntrackedFiles))) {
    throw new Error("Cruft cannot apply updates on an unclean git project.");
  }
}

export async function isGitRepo(
  gitClient: SimpleGit,
  directory: string
): Promise<boolean> {
  try {
    const result = await gitClient.raw(
      ["rev-parse", "--is-inside-work-tree"].join(" "),
      {
        cwd: directory,
      }
    );
    return result.includes("true");
  } catch {
    return false;
  }
}

export async function hasUntrackedFile(statusLine: string): Promise<boolean> {
  return statusLine.trim().startsWith("??");
}

export async function isProjectRepoClean(
  gitClient: SimpleGit,
  directory: string,
  allowUntrackedFiles: boolean
): Promise<boolean> {
  if (!(await isGitRepo(gitClient, directory))) {
    return true;
  }
  const result = await gitClient.raw(["status", "--porcelain"].join(" "), {
    cwd: directory,
  });
  const statusLines = result.toString().split("\n").filter(Boolean);
  if (allowUntrackedFiles) {
    const untrackedFiles = await Promise.all(
      statusLines.map(async (line) => await hasUntrackedFile(line))
    );
    return !untrackedFiles.some((untracked) => untracked);
  }
  return statusLines.length === 0;
}

export async function applyPatchWithRejections(
  gitClient: SimpleGit,
  diff: string,
  expandedDirPath: string
) {
  const offset = await getOffset(gitClient, expandedDirPath);

  const gitApply = ["git", "apply", "--reject"];
  if (offset) {
    gitApply.push("--directory", offset);
  }

  try {
    await gitClient.raw([...gitApply, "--input", diff].join(" "), {
      cwd: expandedDirPath,
    });
  } catch (error) {
    console.error(error);
    console.warn(
      "Project directory may have *.rej files reflecting merge conflicts with the update. Please resolve those conflicts manually."
    );
  }
}

export async function applyThreeWayPatch(
  gitClient: SimpleGit,
  diff: string,
  expandedDirPath: string,
  allowUntrackedFiles: boolean
) {
  const offset = await getOffset(gitClient, expandedDirPath);

  const gitApply = ["git", "apply", "-3"];
  if (offset) {
    gitApply.push("--directory", offset);
  }

  try {
    await gitClient.raw([...gitApply, "--input", diff].join(" "), {
      cwd: expandedDirPath,
    });
  } catch (error) {
    console.error(error);

    const isRepoClean = await isProjectRepoClean(
      gitClient,
      expandedDirPath,
      allowUntrackedFiles
    );

    if (isRepoClean) {
      console.warn(
        "Failed to apply the update. Retrying again with a different update strategy."
      );
      await applyPatchWithRejections(gitClient, diff, expandedDirPath);
    }
  }
}

export async function getOffset(
  gitClient: SimpleGit,
  expandedDirPath: string
): Promise<string> {
  try {
    const result = await gitClient.raw(
      ["rev-parse", "--show-prefix"].join(" "),
      {
        cwd: expandedDirPath,
      }
    );
    return result.toString().trim();
  } catch (error) {
    //TODO: throw better errors here

    throw error;
  }
}

export async function applyPatch(
  gitClient: SimpleGit,
  diff: string,
  expandedDirPath: string,
  allowUntrackedFiles: boolean
) {
  if (await isGitRepo(gitClient, expandedDirPath)) {
    applyThreeWayPatch(gitClient, diff, expandedDirPath, allowUntrackedFiles);
  } else {
    applyPatchWithRejections(gitClient, diff, expandedDirPath);
  }
}
export async function applyProjectUpdates({
  gitClient,
  currentTemplateDir,
  newTemplateDir,
  projectDir,
  skipUpdate,
  skipApplyAsk,
  allowUntrackedFiles,
}: {
  gitClient: SimpleGit;
  currentTemplateDir: string;
  newTemplateDir: string;
  projectDir: string;
  skipUpdate: boolean;
  skipApplyAsk: boolean;
  allowUntrackedFiles: boolean;
}): Promise<boolean> {
  // get the difference between the latest template and the old template
  const diff = await getDiff(gitClient, currentTemplateDir, newTemplateDir);

  if (!skipApplyAsk && !skipUpdate) {
    let inputStr: string = "v";
    while (inputStr === "v") {
      console.log(
        'Respond with "s" to intentionally skip the update while marking your project as up-to-date or respond with "v" to view the changes that will be applied.'
      );
      const answers = await askQuestions([
        {
          type: "list",
          name: "applyDiff",
          message: "Apply diff and update?",
          choices: ["y", "n", "s", "v"],
          default: "y",
        },
      ]);
      inputStr = answers.applyDiff;
      if (inputStr === "v") {
        if (diff.trim()) {
          displayDiff(gitClient, currentTemplateDir, newTemplateDir);
        } else {
          console.warn("There are no changes.");
        }
      }
      if (inputStr === "n") {
        console.log("User cancelled Cookiecutter template update.");
        return false;
      } else if (inputStr === "s") {
        skipUpdate = true;
      }
    }
  }

  if (!skipUpdate && diff.trim()) {
    await applyPatch(gitClient, diff, projectDir, allowUntrackedFiles);
  }
  return true;
}
export async function isProjectUpdated(
  gitClient: SimpleGit,
  currentCommit: string,
  lastCommit: string,
  strict: boolean
): Promise<boolean> {
  if (strict) {
    return currentCommit === lastCommit;
  }
  try {
    await gitClient.raw([
      "merge-base",
      "--is-ancestor",
      currentCommit,
      lastCommit,
    ]);
    return true;
  } catch {
    return false;
  }
}
