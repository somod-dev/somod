import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { generateSAMTemplate } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task generateSAMTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no resources", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        somod: "1.3.2",
        dependencies: {}
      })
    });
    await expect(generateSAMTemplate(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "template.yaml"))).toBeFalsy();
  });

  test("for all valid input", async () => {
    createFiles(dir, {
      "node_modules/@sodaru/baseapi/build/serverless/template.json":
        JSON.stringify({
          Resources: {}
        }),
      "node_modules/@sodaru/baseapi/package.json": JSON.stringify({
        name: "@sodaru/baseapi",
        version: "1.0.1",
        somod: "1.3.2",
        dependencies: {}
      }),
      "serverless/template.yaml": dump({
        Resources: {
          SimpleTable: {
            Type: "AWS::DynamoDB::Table",
            DeletionPolicy: "Retain",
            UpdateReplacePolicy: "Retain",
            Properties: {}
          }
        }
      }),
      "package.json": JSON.stringify({
        name: "@sodaru/auth-somod",
        version: "1.0.0",
        somod: "1.3.2",
        dependencies: {
          "@sodaru/baseapi": "^1.0.0"
        }
      })
    });

    await expect(generateSAMTemplate(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "template.yaml"), { encoding: "utf8" })
    ).resolves.toEqual(
      dump({
        AWSTemplateFormatVersion: "2010-09-09",
        Transform: "AWS::Serverless-2016-10-31",
        Globals: {
          Function: {
            Runtime: "nodejs16.x",
            Handler: "index.default",
            Architectures: ["arm64"]
          }
        },
        Resources: {
          rd7ec150dSimpleTable: {
            Type: "AWS::DynamoDB::Table",
            DeletionPolicy: "Retain",
            UpdateReplacePolicy: "Retain",
            Properties: {}
          }
        }
      })
    );
  });
});
