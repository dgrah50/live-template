import { Command } from "commander";
import * as path from "path";
import { check } from "./commands/check";
import { create } from "./commands/create";
import { link } from "./commands/link";
import { update } from "./commands/update";
import { diff } from "./commands/diff";
import { getVersion } from "./version";
import simpleGit from "simple-git";
import { getTmpDir } from "./utils/getTmpDir";

const program = new Command();

const gitClient = simpleGit({ baseDir: getTmpDir() });

program
  .name("cruft")
  .description("CLI for managing cruft")
  .version(getVersion());

program
  .command("check")
  .description("Check if the linked template has been updated")
  .option("-p, --project-dir <path>", "Path to the project directory", ".")
  .option("-c, --checkout <ref>", "The git reference to check against")
  .option("--strict", "Ensure exact commit match", true)
  .action((options) => {
    check(options.projectDir, options.checkout, options.strict, gitClient);
  });

program
  .command("create <templateGitUrl>")
  .description("Create a new project from a template")
  .option(
    "-o, --output-dir <path>",
    "Where to output the generated project",
    "."
  )
  .option("--config-file <path>", "Path to the user config file")
  .option("-d, --default-config", "Use defaults instead of config file")
  .option("-e, --extra-context <json>", "JSON string for extra context", "{}")
  .option(
    "-E, --extra-context-file <path>",
    "Path to a JSON file for extra context"
  )
  .option("-y, --no-input", "Do not prompt for template variables")
  .option("--directory <path>", "Directory within repo holding template")
  .option("-c, --checkout <ref>", "Git reference to check against")
  .option(
    "-f, --overwrite-if-exists",
    "Overwrite if output directory exists",
    false
  )
  .option(
    "--skip <list>",
    "Files/patterns to skip on update",
    (value) => value.split(","),
    []
  )
  .action((templateGitUrl, options) => {
    create(templateGitUrl, gitClient, options);
  });

program
  .command("link <templateGitUrl>")
  .description("Link an existing project to a template")
  .option("-p, --project-dir <path>", "Path to the project directory", ".")
  .option("-c, --checkout <ref>", "Git reference to check against")
  .option("-y, --no-input", "Do not prompt for commit hash")
  .option("--config-file <path>", "Path to the user config file")
  .option("-d, --default-config", "Use defaults instead of config file")
  .option("-e, --extra-context <json>", "JSON string for extra context", "{}")
  .option("--directory <path>", "Directory within repo holding template")
  .action((templateGitUrl, options) => {
    link(templateGitUrl, options);
  });

program
  .command("update")
  .description(
    "Update the project to the latest version of the linked template"
  )
  .option("-p, --project-dir <path>", "Path to the project directory", ".")
  .option("-i, --cookiecutter-input", "Prompt for template variables", false)
  .option("-r, --refresh-private-variables", "Refresh private variables", false)
  .option(
    "-y, --skip-apply-ask",
    "Skip prompts and apply updates directly",
    false
  )
  .option("-s, --skip-update", "Skip template updates but update state", false)
  .option("-c, --checkout <ref>", "Git reference to check against")
  .option("--strict", "Ensure exact commit match", true)
  .option(
    "--allow-untracked-files",
    "Allow untracked files in git repository",
    false
  )
  .option("-e, --extra-context <json>", "JSON string for extra context", "{}")
  .option(
    "--extra-context-file <path>",
    "Path to a JSON file for extra context"
  )
  .action((options) => {
    update(options);
  });

program
  .command("diff")
  .description("Show the diff between the project and the current template")
  .option("-p, --project-dir <path>", "Path to the project directory", ".")
  .option("-e, --exit-code", "Exit with status 1 on non-empty diff", false)
  .option("-c, --checkout <ref>", "Git reference to check against")
  .action((options) => {
    diff(options.projectDir, options.exitCode, options.checkout);
  });

program.parse(process.argv);
