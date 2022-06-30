import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "@sodev/test-utils";
import { generateSamConfigParameterOverrides } from "../../../src/utils/serverless/parameter";
import { generateSAMConfigToml } from "../../../src";
import { readFile } from "fs/promises";
import { join } from "path";

jest.mock("../../../src/utils/serverless/parameter", () => {
  return {
    __esModule: true,
    generateSamConfigParameterOverrides: jest.fn().mockResolvedValue({
      p1: '{"string":"this is a string","integer":123,"number":100.02}',
      p2: '{"boolean":true,"null":null}',
      p3: '{"array":["this is a string",123,100.02,true,null],"object.content":{"string":"this is a string conatining quotes (\\")","integer":123,"number":100.02,"boolean":false,"null":null,"array":["this is a string",123,100.02,true,null],"object":{}}}'
    })
  };
});

const expectedParameterOverrides =
  'parameter_overrides = "p1=\\"{\\\\\\"string\\\\\\":\\\\\\"this is a string\\\\\\",\\\\\\"integer\\\\\\":123,\\\\\\"number\\\\\\":100.02}\\" p2=\\"{\\\\\\"boolean\\\\\\":true,\\\\\\"null\\\\\\":null}\\" p3=\\"{\\\\\\"array\\\\\\":[\\\\\\"this is a string\\\\\\",123,100.02,true,null],\\\\\\"object.content\\\\\\":{\\\\\\"string\\\\\\":\\\\\\"this is a string conatining quotes (\\\\\\\\\\\\\\")\\\\\\",\\\\\\"integer\\\\\\":123,\\\\\\"number\\\\\\":100.02,\\\\\\"boolean\\\\\\":false,\\\\\\"null\\\\\\":null,\\\\\\"array\\\\\\":[\\\\\\"this is a string\\\\\\",123,100.02,true,null],\\\\\\"object\\\\\\":{}}}\\""';

describe("test Task generateSAMConfigToml", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir();
    mockedFunction(generateSamConfigParameterOverrides).mockClear();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no prior samconfig.toml", async () => {
    await expect(
      generateSAMConfigToml(dir, ["somod"])
    ).resolves.toBeUndefined();
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledTimes(1);
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledWith(dir, [
      "somod"
    ]);
    await expect(
      readFile(join(dir, "samconfig.toml"), { encoding: "utf8" })
    ).resolves.toEqual(`${expectedParameterOverrides}`);
  });

  test("for samconfig.toml containing no parameter_overrides", async () => {
    createFiles(dir, {
      "samconfig.toml": `version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "test-parameter-overrides"
s3_bucket = "aws-sam-cli-managed-default-samclisourcebucket-j987kkha2axr"
s3_prefix = "test-parameter-overrides"
region = "ap-south-1"
capabilities = "CAPABILITY_IAM"
`
    });
    await expect(
      generateSAMConfigToml(dir, ["somod"])
    ).resolves.toBeUndefined();
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledTimes(1);
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledWith(dir, [
      "somod"
    ]);
    await expect(
      readFile(join(dir, "samconfig.toml"), { encoding: "utf8" })
    ).resolves.toEqual(
      `version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "test-parameter-overrides"
s3_bucket = "aws-sam-cli-managed-default-samclisourcebucket-j987kkha2axr"
s3_prefix = "test-parameter-overrides"
region = "ap-south-1"
capabilities = "CAPABILITY_IAM"
${expectedParameterOverrides}`
    );
  });

  test("for samconfig.toml containing prior parameter_overrides", async () => {
    createFiles(dir, {
      "samconfig.toml": `version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "test-parameter-overrides"
s3_bucket = "aws-sam-cli-managed-default-samclisourcebucket-j987kkha2axr"
s3_prefix = "test-parameter-overrides"
region = "ap-south-1"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "Param1=\\"Hah\\""
image_repositories = []
`
    });
    await expect(
      generateSAMConfigToml(dir, ["somod"])
    ).resolves.toBeUndefined();
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledTimes(1);
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledWith(dir, [
      "somod"
    ]);
    await expect(
      readFile(join(dir, "samconfig.toml"), { encoding: "utf8" })
    ).resolves.toEqual(
      `version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "test-parameter-overrides"
s3_bucket = "aws-sam-cli-managed-default-samclisourcebucket-j987kkha2axr"
s3_prefix = "test-parameter-overrides"
region = "ap-south-1"
capabilities = "CAPABILITY_IAM"
${expectedParameterOverrides}
image_repositories = []
`
    );
  });
});
