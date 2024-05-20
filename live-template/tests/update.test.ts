import * as fs from "fs";
import * as path from "path";
import {
  expect,
  test,
  mock,
  describe,
  beforeEach,
  afterEach,
  jest,
} from "bun:test";
import { type SimpleGit } from "simple-git";

import { update } from "../src/commands/update";
import { setupProjectDir } from "./setupProjectDir";

import { dummyCruft } from "./dummyCruft";

mock.module("../src/utils/cruftJson", () => ({
  parseCruftJson: mock(),
  generateCruftJson: mock(),
}));

mock.module("../src/utils/updateUtils", () => ({
  validateExtraContextFile: mock(),
  mergeExtraContext: mock(),
  ensureProjectRepoClean: mock(),
  getLastCommitHash: mock(),
  isProjectUpdated: mock(),
  generateProjectToDirectory: mock(),
  applyProjectUpdates: mock(),
}));

mock.module("../src/utils/prompter", () => ({
  askQuestions: mock(),
}));

const mockGitClient = {
  clone: mock(),
  cwd: mock().mockReturnThis(),
  checkout: mock().mockReturnThis(),
  log: mock().mockResolvedValue({
    latest: { hash: "8c95c7af45e94374df8c200ab8b87ab63aab79e2" },
  }),
  raw: mock().mockResolvedValue(""),
} as unknown as SimpleGit;

describe("update command", () => {
  let projectDir: string;

  beforeEach(() => {
    projectDir = setupProjectDir();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  test("update with up-to-date project", async () => {
    mock.module("../src/utils/cruftJson", () => ({
      parseCruftJson: mock().mockReturnValue(dummyCruft),
    }));

    mock.module("../src/utils/updateUtils", () => ({
      isProjectUpdated: mock().mockResolvedValue(true),
    }));

    console.log = mock();

    const cruftFilePath = path.join(projectDir, ".cruft.json");
    fs.writeFileSync(cruftFilePath, JSON.stringify(dummyCruft, null, 2));

    await update(mockGitClient, { outputDir: projectDir });

    expect(mockGitClient.clone).toHaveBeenCalled();
    expect(mockGitClient.cwd).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      "Nothing to do, the project already up to date!"
    );
  });

  test("update with unclean git repository", async () => {
    mock.module("../src/utils/updateUtils", () => ({
      ensureProjectRepoClean: mock().mockImplementation(() => {
        throw new Error("Unclean working directory");
      }),
    }));

    expect(update(mockGitClient, { outputDir: projectDir })).rejects.toThrow(
      "Unclean working directory"
    );

    expect(mockGitClient.clone).not.toHaveBeenCalled();
  });

  // test("update with extra context", async () => {
  //   const cruftFilePath = path.join(projectDir, ".cruft.json");
  //   const cruftState = dummyCruft;

  //   mock.module("../src/utils/cruftJson", () => ({
  //     parseCruftJson: mock().mockReturnValue(cruftState),
  //   }));

  //   mock.module("../src/utils/updateUtils", () => ({
  //     isProjectUpdated: mock().mockResolvedValue(false),
  //     generateProjectToDirectory: mock().mockResolvedValue("/tmp/directory"),
  //   }));

  //   const extraContext = { new_key: "new_value" };

  //   fs.writeFileSync(cruftFilePath, JSON.stringify(cruftState, null, 2));

  //   await update(mockGitClient, { outputDir: projectDir, extraContext });

  //   expect(mockGitClient.clone).toHaveBeenCalled();
  //   expect(mockGitClient.cwd).toHaveBeenCalled();
  //   expect(mockGitClient.log).toHaveBeenCalled();
  //   expect(mockGitClient.raw).toHaveBeenCalled();
  //   expect(cruftState.context.nunjucks.new_key).toBe("new_value");
  //   expect(cruftJson.generateCruftJson).toHaveBeenCalledWith(
  //     projectDir,
  //     cruftState
  //   );
  // });

  // test("update with conflicts", async () => {
  //   const cruftFilePath = path.join(projectDir, ".cruft.json");
  //   const cruftState = {
  //     template: "https://github.com/user/repo.git",
  //     commit: "abc123",
  //     context: { nunjucks: { project_name: "Test Project" } },
  //   };

  //   mock.module("../src/utils/cruftJson", () => ({
  //     parseCruftJson: mock().mockReturnValue(cruftState),
  //   }));

  //   mock.module("../src/utils/updateUtils", () => ({
  //     isProjectUpdated: mock().mockResolvedValue(false),
  //     generateProjectToDirectory: mock().mockResolvedValue("/tmp/directory"),
  //     applyProjectUpdates: mock().mockResolvedValue(false),
  //   }));

  //   fs.writeFileSync(cruftFilePath, JSON.stringify(cruftState, null, 2));

  //   await update(mockGitClient, { outputDir: projectDir });

  //   expect(mockGitClient.clone).toHaveBeenCalled();
  //   expect(mockGitClient.cwd).toHaveBeenCalled();
  //   expect(mockGitClient.log).toHaveBeenCalled();
  //   expect(mockGitClient.raw).toHaveBeenCalled();
  //   expect(updateUtils.applyProjectUpdates).toHaveBeenCalled();
  //   expect(console.log).not.toHaveBeenCalledWith(
  //     "Good work! Project's cruft has been updated and is as clean as possible!"
  //   );
  // });

  // test("update with allow untracked files", async () => {
  //   const cruftFilePath = path.join(projectDir, ".cruft.json");
  //   const cruftState = {
  //     template: "https://github.com/user/repo.git",
  //     commit: "abc123",
  //     context: { nunjucks: { project_name: "Test Project" } },
  //   };

  //   mock.module("../src/utils/cruftJson", () => ({
  //     parseCruftJson: mock().mockReturnValue(cruftState),
  //   }));

  //   mock.module("../src/utils/updateUtils", () => ({
  //     isProjectUpdated: mock().mockResolvedValue(false),
  //     generateProjectToDirectory: mock().mockResolvedValue("/tmp/directory"),
  //     applyProjectUpdates: mock().mockResolvedValue(true),
  //   }));

  //   fs.writeFileSync(cruftFilePath, JSON.stringify(cruftState, null, 2));

  //   await update(mockGitClient, {
  //     outputDir: projectDir,
  //     allowUntrackedFiles: true,
  //   });

  //   expect(mockGitClient.clone).toHaveBeenCalled();
  //   expect(mockGitClient.cwd).toHaveBeenCalled();
  //   expect(mockGitClient.log).toHaveBeenCalled();
  //   expect(mockGitClient.raw).toHaveBeenCalled();
  //   expect(updateUtils.applyProjectUpdates).toHaveBeenCalled();
  //   expect(console.log).toHaveBeenCalledWith(
  //     "Good work! Project's cruft has been updated and is as clean as possible!"
  //   );
  // });

  // test("update with interactive cancel", async () => {
  //   const cruftFilePath = path.join(projectDir, ".cruft.json");
  //   const cruftState = {
  //     template: "https://github.com/user/repo.git",
  //     commit: "abc123",
  //     context: { nunjucks: { project_name: "Test Project" } },
  //   };

  //   mock.module("../src/utils/cruftJson", () => ({
  //     parseCruftJson: mock().mockReturnValue(cruftState),
  //   }));

  //   mock.module("../src/utils/updateUtils", () => ({
  //     isProjectUpdated: mock().mockResolvedValue(false),
  //     generateProjectToDirectory: mock().mockResolvedValue("/tmp/directory"),
  //     applyProjectUpdates: mock().mockResolvedValue(false),
  //   }));

  //   mock.module("../src/utils/prompter", () => ({
  //     askQuestions: mock().mockResolvedValue({ applyDiff: "n" }),
  //   }));

  //   fs.writeFileSync(cruftFilePath, JSON.stringify(cruftState, null, 2));

  //   await update(mockGitClient, { outputDir: projectDir, skipApplyAsk: false });

  //   expect(prompter.askQuestions).toHaveBeenCalled();
  //   expect(updateUtils.applyProjectUpdates).not.toHaveBeenCalled();
  //   expect(console.log).toHaveBeenCalledWith(
  //     "User cancelled Cookiecutter template update."
  //   );
  // });

  // test("update with interactive view changes", async () => {
  //   const cruftFilePath = path.join(projectDir, ".cruft.json");
  //   const cruftState = {
  //     template: "https://github.com/user/repo.git",
  //     commit: "abc123",
  //     context: { nunjucks: { project_name: "Test Project" } },
  //   };

  //   mock.module("../src/utils/cruftJson", () => ({
  //     parseCruftJson: mock().mockReturnValue(cruftState),
  //   }));

  //   mock.module("../src/utils/updateUtils", () => ({
  //     isProjectUpdated: mock().mockResolvedValue(false),
  //     generateProjectToDirectory: mock().mockResolvedValue("/tmp/directory"),
  //     applyProjectUpdates: mock().mockResolvedValue(true),
  //   }));

  //   mock.module("../src/utils/prompter", () => ({
  //     askQuestions: mock()
  //       .mockResolvedValueOnce({ applyDiff: "v" })
  //       .mockResolvedValueOnce({ applyDiff: "y" }),
  //   }));

  //   fs.writeFileSync(cruftFilePath, JSON.stringify(cruftState, null, 2));

  //   await update(mockGitClient, { outputDir: projectDir, skipApplyAsk: false });

  //   expect(prompter.askQuestions).toHaveBeenCalledTimes(2);
  //   expect(updateUtils.applyProjectUpdates).toHaveBeenCalled();
  //   expect(console.log).toHaveBeenCalledWith(
  //     "Good work! Project's cruft has been updated and is as clean as possible!"
  //   );
  // });
});
