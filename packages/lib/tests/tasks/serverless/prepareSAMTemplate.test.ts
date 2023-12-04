import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { IContext } from "somod-types";
import { prepareSAMTemplate } from "../../../src";
import { prepareSamTemplate as prepareSamTemplateUtil } from "../../../src/utils/serverless/serverlessTemplate/prepare";
import { createTempDir, deleteDir, mockedFunction } from "../../utils";

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
    mockedFunction(prepareSamTemplateUtil).mockReset();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no resources", async () => {
    mockedFunction(prepareSamTemplateUtil).mockResolvedValue({ Resources: {} });
    await expect(
      prepareSAMTemplate({ dir } as IContext)
    ).resolves.toBeUndefined();
    expect(prepareSamTemplateUtil).toHaveBeenCalledTimes(1);
    expect(prepareSamTemplateUtil).toHaveBeenCalledWith({ dir });
    expect(existsSync(join(dir, "template.yaml"))).not.toBeTruthy();
  });

  test("for valid template.yaml", async () => {
    mockedFunction(prepareSamTemplateUtil).mockResolvedValue({
      Resources: {
        R1: { Type: "T1", Properties: {} },
        R2: { Type: "T2", Properties: {} }
      }
    });

    await expect(
      prepareSAMTemplate({
        dir,
        serverlessTemplateHandler: { functionNodeRuntimeVersion: "14" }
      } as IContext)
    ).resolves.toBeUndefined();
    expect(prepareSamTemplateUtil).toHaveBeenCalledTimes(1);
    expect(prepareSamTemplateUtil).toHaveBeenCalledWith({
      dir,
      serverlessTemplateHandler: { functionNodeRuntimeVersion: "14" }
    });
    await expect(readFile(join(dir, "template.yaml"), "utf8")).resolves.toEqual(
      `AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Globals:
  Function:
    Runtime: nodejs14.x
    Handler: index.default
    Architectures:
      - arm64
Conditions:
  SkipCreation:
    Fn::Equals:
      - '1'
      - '0'
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
