import * as fs from "fs";
import * as path from "path";
import { templatingEngine } from "../utils/templating";
import simpleGit, { type SimpleGit } from "simple-git";
import { generateCruftJson, parseCruftJson } from "../utils/cruftJson";
import { getTmpDir } from "../utils/getTmpDir";

interface CreateOptions {
  outputDir: string;
  configFile?: string;
  defaultConfig?: boolean;
  extraContext?: { [key: string]: string };
  extraContextFile?: string;
  noInput?: boolean;
  checkout?: string | null | undefined;
  overwriteIfExists?: boolean;
  skip?: boolean;
}

export async function create(
  templateGitUrl: string,
  gitClient: SimpleGit,
  options: CreateOptions
): Promise<void> {
  const {
    outputDir,
    configFile,
    defaultConfig,
    extraContext,
    extraContextFile,
    noInput,
    checkout,
    overwriteIfExists,
    skip,
  } = options;

  const workingDir = getTmpDir();
  await gitClient.clone(templateGitUrl, workingDir, { "--depth": "1" });
  await gitClient.cwd(workingDir);

  if (checkout) {
    await gitClient.checkout(checkout);
  }

  const lastCommit = (await gitClient.log(["-n", "1"])).latest?.hash;

  if (lastCommit == undefined) {
    throw new Error("No commit found in template");
  }

  let context = {};
  if (extraContext) {
    try {
      context = extraContext;
    } catch (error) {
      console.warn(
        "Failed to parse JSON, falling back to empty object:",
        error
      );
    }
  }

  if (extraContextFile && fs.existsSync(extraContextFile)) {
    const fileContext = JSON.parse(fs.readFileSync(extraContextFile, "utf8"));
    Object.assign(context, fileContext);
  }

  if (!noInput) {
    // Implement prompt for template variables if needed
  }

  templatingEngine.renderGitTemplateDirToNewOutputDir(
    workingDir,
    outputDir,
    context
  );

  // Save cruft state
  const cruftContent = {
    template: templateGitUrl,
    commit: lastCommit,
    context: {
      nunjucks: {
        _template: templateGitUrl,
        ...context,
      },
    },
    directory: outputDir,
    checkout,
  };
  generateCruftJson(outputDir, cruftContent);
}
