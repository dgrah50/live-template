import * as fs from "fs";
import * as path from "path";
import { templatingEngine } from "../utils/templating";
import simpleGit from "simple-git";
import { parseCruftJson } from "../utils/cruftJson";

export async function update(options: any): Promise<void> {
  const {
    projectDir,
    cookiecutterInput,
    refreshPrivateVariables,
    skipApplyAsk,
    skipUpdate,
    checkout,
    strict,
    allowUntrackedFiles,
    extraContext,
    extraContextFile,
  } = options;

  const cruftState = parseCruftJson(projectDir);

  const git = simpleGit();
  await git.clone(cruftState.template, "tmp-repo", { "--depth": "1" });
  await git.cwd("tmp-repo");

  if (checkout) {
    await git.checkout(checkout);
  }

  const lastCommit = (await git.log(["-n", "1"])).latest?.hash;
  if (lastCommit == undefined) {
    throw new Error("No commit found in the repository");
  }

  const context = JSON.parse(extraContext);
  if (extraContextFile && fs.existsSync(extraContextFile)) {
    const fileContext = JSON.parse(fs.readFileSync(extraContextFile, "utf8"));
    Object.assign(context, fileContext);
  }

  if (!cookiecutterInput) {
    // Implement prompt for template variables if needed
  }

  // Placeholder for update logic
  const templateFiles = fs.readdirSync(cruftState.directory || ".");

  for (const file of templateFiles) {
    const filePath = path.join(cruftState.directory || ".", file);
    const fileContent = fs.readFileSync(filePath, "utf8");
    const renderedContent = templatingEngine.render(fileContent, context);
    const outputFilePath = path.join(projectDir, file);
    fs.writeFileSync(outputFilePath, renderedContent);
  }

  // Save updated cruft state
  cruftState.commit = lastCommit;
  cruftState.checkout = checkout;
  cruftState.context = { nunjucks: context };
  fs.writeFileSync(
    path.join(projectDir, ".cruft.json"),
    JSON.stringify(cruftState, null, 2)
  );
}
