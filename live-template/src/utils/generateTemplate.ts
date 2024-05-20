import { type SimpleGit } from "simple-git";

interface CookiecutterOptions {
  outputDir: string;
  repo: string;
  cruftState: any;
  projectDir: string;
  cookiecutterInput?: boolean;
  checkout?: string;
  deletedPaths?: Set<string>;
  updateDeletedPaths?: boolean;
}

export async function getDiff(
  gitClient: SimpleGit,
  oldDir: string,
  newDir: string
): Promise<string> {
  // Use git diff to get the differences between two directories
  const diff = await gitClient.raw([
    "diff",
    "--no-index",
    "--relative",
    "--binary",
    "-p",
    oldDir,
    newDir,
  ]);
  return diff;
}

export async function displayDiff(
  gitClient: SimpleGit,
  oldDir: string,
  newDir: string
): Promise<void> {
  // Display the diff using git diff
  const diff = await getDiff(gitClient, oldDir, newDir);
  console.log("*******");
  console.log(diff);
  console.log("*******");
}
