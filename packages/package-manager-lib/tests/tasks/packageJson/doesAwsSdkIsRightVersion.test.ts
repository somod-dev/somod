import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesAwsSdkIsRightVersionInPackageJson } from "../../../src";

describe("Test Task doesAwsSdkIsRightVersionInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no functions and no dependencies set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(
      doesAwsSdkIsRightVersionInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test("for no functions and dependencies set", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        devDependencies: { "aws-sdk": "2.952.0" },
        peerDependencies: { "aws-sdk": "2.952.0" }
      })
    });
    await expect(
      doesAwsSdkIsRightVersionInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test("for functions and no dependencies set", async () => {
    createFiles(dir, {
      ".slp/functions/": "",
      "package.json": JSON.stringify({})
    });
    await expect(doesAwsSdkIsRightVersionInPackageJson(dir)).rejects.toEqual(
      new Error(
        [
          `aws-sdk must be installed as devDependencies in ${dir}/package.json`,
          `aws-sdk must be installed as peerDependencies in ${dir}/package.json`
        ].join("\n")
      )
    );
  });

  test("for functions and dependencies set", async () => {
    createFiles(dir, {
      ".slp/functions/": "",
      "package.json": JSON.stringify({
        devDependencies: { "aws-sdk": "2.952.0" },
        peerDependencies: { "aws-sdk": "2.952.0" }
      })
    });
    await expect(
      doesAwsSdkIsRightVersionInPackageJson(dir)
    ).resolves.toBeUndefined();
  });

  test("for no functions and wrong dependencies set", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        devDependencies: { "aws-sdk": "2.952.1" },
        peerDependencies: { "aws-sdk": "2.952.1" }
      })
    });
    await expect(doesAwsSdkIsRightVersionInPackageJson(dir)).rejects.toEqual(
      new Error(
        [
          `devDependencies.aws-sdk must be 2.952.0 in ${dir}/package.json`,
          `peerDependencies.aws-sdk must be 2.952.0 in ${dir}/package.json`
        ].join("\n")
      )
    );
  });

  test("for functions and wrong dependencies set", async () => {
    createFiles(dir, {
      ".slp/functions/": "",
      "package.json": JSON.stringify({
        devDependencies: { "aws-sdk": "2.953.0" },
        peerDependencies: { "aws-sdk": "2.954.0" }
      })
    });
    await expect(doesAwsSdkIsRightVersionInPackageJson(dir)).rejects.toEqual(
      new Error(
        [
          `devDependencies.aws-sdk must be 2.952.0 in ${dir}/package.json`,
          `peerDependencies.aws-sdk must be 2.952.0 in ${dir}/package.json`
        ].join("\n")
      )
    );
  });
});
