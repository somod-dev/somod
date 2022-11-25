import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";
import { prepareSamTemplate as prepareSamTemplateUtil } from "../../../src/utils/serverless/serverlessTemplate/prepare";
import { prepareSAMTemplate } from "../../../src";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { join } from "path";
import { existsSync } from "fs";
import { dump } from "js-yaml";
import { readFile } from "fs/promises";

jest.mock("../../../src/utils/serverless/serverlessTemplate/prepare", () => {
  return {
    __esModule: true,
    prepareSamTemplate: jest.fn()
  };
});

describe("test Task prepareSAMTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    ModuleHandler.initialize(dir, []);
    mockedFunction(prepareSamTemplateUtil).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no resources", async () => {
    mockedFunction(prepareSamTemplateUtil).mockResolvedValue({ Resources: {} });
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/template.yaml": "Resources: {}"
    });
    await expect(prepareSAMTemplate(dir)).resolves.toBeUndefined();
    expect(prepareSamTemplateUtil).toHaveBeenCalledTimes(1);
    expect(prepareSamTemplateUtil).toHaveBeenCalledWith(dir, []);
    expect(existsSync(join(dir, "template.yaml"))).not.toBeTruthy();
  });

  test("for valid template.yaml", async () => {
    mockedFunction(prepareSamTemplateUtil).mockResolvedValue({
      Resources: {
        R1: { Type: "T1", Properties: {} },
        R2: { Type: "T2", Properties: {} }
      }
    });
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/template.yaml": dump({
        Resources: {
          R1: { Type: "T1", Properties: {} },
          R2: { Type: "T2", Properties: {} }
        }
      })
    });
    await expect(
      prepareSAMTemplate(dir, [
        { getProcessor: jest.fn(), getValidator: jest.fn(), keyword: "A" }
      ])
    ).resolves.toBeUndefined();
    expect(prepareSamTemplateUtil).toHaveBeenCalledTimes(1);
    expect(prepareSamTemplateUtil).toHaveBeenCalledWith(dir, [
      {
        getProcessor: expect.any(Function),
        getValidator: expect.any(Function),
        keyword: "A"
      }
    ]);
    await expect(readFile(join(dir, "template.yaml"), "utf8")).resolves.toEqual(
      `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Globals:
  Function:
    Runtime: nodejs16.x
    Handler: index.default
    Architectures:
      - arm64
Resources:
  R1:
    Type: T1
    Properties: {}
  R2:
    Type: T2
    Properties: {}
`
    );
  });
});
