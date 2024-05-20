import { type SimpleGit } from "simple-git";

import { parseCruftJson, generateCruftJson } from "../utils/cruftJson";
import {
  validateExtraContextFile,
  mergeExtraContext,
  ensureProjectRepoClean,
  getLastCommitHash,
  isProjectUpdated,
  generateProjectToDirectory,
  applyProjectUpdates,
} from "../utils/updateUtils";
import { getTmpDir } from "../utils/getTmpDir";

interface UpdateOptions {
  outputDir: string;
  skipApplyAsk?: boolean;
  skipUpdate?: boolean;
  checkout?: string;
  strict?: boolean;
  allowUntrackedFiles?: boolean;
  extraContext?: Record<string, any>;
  extraContextFile?: string;
}

export async function update(
  gitClient: SimpleGit,
  options: UpdateOptions
): Promise<boolean> {
  const {
    outputDir,
    skipApplyAsk = true,
    skipUpdate = false,
    checkout,
    strict = true,
    allowUntrackedFiles = false,
    extraContext,
    extraContextFile,
  } = options;

  try {
    // Update specified project's cruft to the latest and greatest release.
    const cruftState = parseCruftJson(outputDir);

    // These are the new variables from the command line that can be used to override the old variables when updating
    if (extraContextFile) {
      validateExtraContextFile(extraContextFile, outputDir);
      mergeExtraContext(extraContextFile, cruftState, extraContext);
    }

    // If the project dir is a git repository, we ensure
    // that the user has a clean working directory before proceeding
    await ensureProjectRepoClean(gitClient, outputDir, allowUntrackedFiles);

    const repoDir = getTmpDir();

    // Clone the template
    await gitClient.clone(cruftState.template, repoDir, {
      "--depth": "1",
    });
    await gitClient.cwd(repoDir);

    const startHash = cruftState.commit;
    const latestHash = await getLastCommitHash(gitClient);

    if (
      !extraContext &&
      (await isProjectUpdated(gitClient, cruftState.commit, latestHash, strict))
    ) {
      console.log("Nothing to do, the project already up to date!");
      return Promise.resolve(false);
    }

    const generatedProjectAtStartHashDirectory =
      await generateProjectToDirectory(
        gitClient,
        cruftState.template,
        startHash
      );

    const generatedProjectAtLatestHashDirectory =
      await generateProjectToDirectory(
        gitClient,
        cruftState.template,
        latestHash
      );

    if (extraContext) {
      Object.assign(cruftState.context.nunjucks, extraContext);
    }

    if (
      await applyProjectUpdates({
        gitClient,
        currentTemplateDir: generatedProjectAtStartHashDirectory,
        newTemplateDir: generatedProjectAtLatestHashDirectory,
        projectDir: outputDir,
        skipUpdate,
        skipApplyAsk,
        allowUntrackedFiles,
      })
    ) {
      cruftState.commit = latestHash;
      cruftState.checkout = checkout;
      generateCruftJson(outputDir, cruftState);
      console.log(
        "Good work! Project's cruft has been updated and is as clean as possible!"
      );
    }

    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(error);
  }
}
