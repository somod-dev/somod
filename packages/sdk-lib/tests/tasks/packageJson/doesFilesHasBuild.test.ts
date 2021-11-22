import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesFilesHasBuildInPackageJson } from "../../../src";

describe("Test Task doesFilesHasBuildInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no files set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesFilesHasBuildInPackageJson(dir)).rejects.toEqual(
      new Error(`files must include build in ${dir}/package.json`)
    );
  });

  test("for files set to []", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ files: [] }) });
    await expect(doesFilesHasBuildInPackageJson(dir)).rejects.toEqual(
      new Error(`files must include build in ${dir}/package.json`)
    );
  });

  test("for files set to ['bin']", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ files: ["bin"] }) });
    await expect(doesFilesHasBuildInPackageJson(dir)).rejects.toEqual(
      new Error(`files must include build in ${dir}/package.json`)
    );
  });

  test("for files set to ['build']", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ files: ["build"] }) });
    await expect(doesFilesHasBuildInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for files set to ['bin','build']", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ files: ["bin", "build"] })
    });
    await expect(doesFilesHasBuildInPackageJson(dir)).resolves.toBeUndefined();
  });
});
