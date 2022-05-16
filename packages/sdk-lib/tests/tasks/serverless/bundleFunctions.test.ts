import { childProcess } from "@solib/cli-base";
import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { bundleFunctions } from "../../../src";

describe("Test Task bundleFunctions", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no functions", async () => {
    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
  });

  test("with empty functions dir", async () => {
    createFiles(dir, { "serverless/functions/": "" });
    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
  });

  test("with one function and no exclude file", async () => {
    createFiles(dir, { "serverless/functions/f1.ts": "" });
    await expect(bundleFunctions(dir)).rejects.toHaveProperty(
      "message",
      `ENOENT: no such file or directory, open '${join(
        dir,
        "build/serverless/functions/f1/exclude.json"
      )}'`
    );
  });

  test("with one function and valid exclude file", async () => {
    createFiles(dir, {
      "build/serverless/functions/f1/exclude.json": '{"external":["lodash"]}',
      "serverless/functions/f1.ts":
        'import {difference} from "lodash"; export const diff = (a:string[], b:string[]):string[] => {return difference(a,b);}'
    });
    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/serverless/functions/f1/index.js"), {
        encoding: "utf8"
      })
    ).resolves.toMatchSnapshot();
  });

  test("with multiple functions", async () => {
    createFiles(dir, {
      "build/serverless/functions/f1/exclude.json": '{"external":["lodash"]}',
      "build/serverless/functions/f2/exclude.json": '{"external":["aws-sdk"]}',
      "serverless/functions/f1.ts":
        'import {difference} from "lodash"; export const diff = (a:string[], b:string[]):string[] => {return difference(a,b);}',
      "serverless/functions/f2.ts":
        'import {DynamoDB} from "aws-sdk";import difference from "lodash/difference"; export const conn = new DynamoDB(); export const diff = (a:string[], b:string[]):string[] => {return difference(a,b);}',
      "package.json": JSON.stringify(
        {
          name: "sample",
          version: "1.0.0",
          dependencies: { lodash: "^4.17.21" }
        },
        null,
        2
      )
    });

    await childProcess(dir, process.platform == "win32" ? "npm.cmd" : "npm", [
      "install"
    ]);

    await expect(bundleFunctions(dir)).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, "build/serverless/functions/f1/index.js"), {
        encoding: "utf8"
      })
    ).resolves.toMatchSnapshot();
    await expect(
      readFile(join(dir, "build/serverless/functions/f2/index.js"), {
        encoding: "utf8"
      })
    ).resolves.toMatchSnapshot();
  });
});
