import * as fs from "fs";
import * as path from "path";
import simpleGit, { type SimpleGit } from "simple-git";
import {
  expect,
  test,
  describe,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from "bun:test";
import { setupProjectDir } from "./setupProjectDir";
import {
  applyPatchWithRejections,
  applyThreeWayPatch,
} from "../src/utils/updateUtils";

const gitClient = {
  clone: mock(),
  cwd: mock().mockReturnThis(),
  checkout: mock().mockReturnThis(),
  log: mock().mockResolvedValue({
    latest: { hash: "8c95c7af45e94374df8c200ab8b87ab63aab79e2" },
  }),
  raw: mock().mockResolvedValue(""),
} as unknown as SimpleGit;

describe("updateUtils", () => {
  let projectDir: string;
  let expandedDirPath: string;

  beforeEach(() => {
    projectDir = setupProjectDir();
    expandedDirPath = path.join(projectDir, "expanded");

    fs.mkdirSync(expandedDirPath, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  test("applyPatchWithRejections applies patch with rejections", async () => {
    const diff = "dummy diff content";
    const newGitClient = {
      clone: mock(),
      cwd: mock().mockReturnThis(),
      checkout: mock().mockReturnThis(),
      log: mock().mockResolvedValue({
        latest: { hash: "8c95c7af45e94374df8c200ab8b87ab63aab79e2" },
      }),
      raw: mock()
        .mockImplementationOnce(() => "offset")
        .mockImplementationOnce(() => {
          throw new Error("three-way merge failed");
        }),
    } as unknown as SimpleGit;

    console.error = mock();
    console.warn = mock();

    await applyPatchWithRejections(newGitClient, diff, expandedDirPath);

    expect(newGitClient.raw).toHaveBeenLastCalledWith(
      "git apply --reject --directory offset --input dummy diff content",
      { cwd: expandedDirPath }
    );
    expect(console.error).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("merge conflicts")
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  test("applyThreeWayPatch applies three-way patch", async () => {
    const diff = "dummy diff content";

    await applyThreeWayPatch(gitClient, diff, expandedDirPath, true);

    expect(gitClient.raw).toHaveBeenCalledWith(
      "git apply -3 --input dummy diff content",
      { cwd: expandedDirPath }
    );
  });

  test("applyThreeWayPatch falls back to applyPatchWithRejections on failure", async () => {
    const diff = "dummy diff content";

    const newGitClient = {
      clone: mock(),
      cwd: mock().mockReturnThis(),
      checkout: mock().mockReturnThis(),
      log: mock().mockResolvedValue({
        latest: { hash: "8c95c7af45e94374df8c200ab8b87ab63aab79e2" },
      }),
      raw: mock()
        .mockResolvedValueOnce("offset1")
        .mockImplementationOnce(() => {
          throw new Error("three-way merge failed");
        })
        .mockResolvedValueOnce("offset2")
        .mockResolvedValueOnce("isGitRepo1")
        .mockResolvedValueOnce("isGitRepo"),
    } as unknown as SimpleGit;

    console.error = mock();
    console.warn = mock();

    await applyThreeWayPatch(newGitClient, diff, expandedDirPath, true);

    expect(newGitClient.raw).toHaveBeenCalledTimes(5);
    expect(newGitClient.raw).toHaveBeenLastCalledWith(
      expect.stringContaining("git apply --reject --directory isGitRepo1"),
      expect.any(Object)
    );

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "Failed to apply the update. Retrying again with a different update strategy."
      )
    );
  });
});
