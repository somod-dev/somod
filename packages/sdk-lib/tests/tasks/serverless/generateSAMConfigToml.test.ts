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
import { existsSync } from "fs";

jest.mock("../../../src/utils/serverless/parameter", () => {
  return {
    __esModule: true,
    generateSamConfigParameterOverrides: jest.fn()
  };
});

const defaultSamConfigContent = `version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "test-parameter-overrides"
s3_bucket = "aws-sam-cli-managed-default-samclisourcebucket-j987kkha2axr"
s3_prefix = "test-parameter-overrides"
region = "ap-south-1"
capabilities = "CAPABILITY_IAM"
`;

const expectedParameterOverrides =
  'parameter_overrides = "p1=\\"{\\\\\\"string\\\\\\":\\\\\\"this is a string\\\\\\",\\\\\\"integer\\\\\\":123,\\\\\\"number\\\\\\":100.02}\\" p2=\\"{\\\\\\"boolean\\\\\\":true,\\\\\\"null\\\\\\":null}\\" p3=\\"{\\\\\\"array\\\\\\":[\\\\\\"this is a string\\\\\\",123,100.02,true,null],\\\\\\"object.content\\\\\\":{\\\\\\"string\\\\\\":\\\\\\"this is a string conatining quotes (\\\\\\\\\\\\\\")\\\\\\",\\\\\\"integer\\\\\\":123,\\\\\\"number\\\\\\":100.02,\\\\\\"boolean\\\\\\":false,\\\\\\"null\\\\\\":null,\\\\\\"array\\\\\\":[\\\\\\"this is a string\\\\\\",123,100.02,true,null],\\\\\\"object\\\\\\":{}}}\\""';

describe("test Task generateSAMConfigToml", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir();
    mockedFunction(generateSamConfigParameterOverrides)
      .mockClear()
      .mockResolvedValue({
        p1: '{"string":"this is a string","integer":123,"number":100.02}',
        p2: '{"boolean":true,"null":null}',
        p3: '{"array":["this is a string",123,100.02,true,null],"object.content":{"string":"this is a string conatining quotes (\\")","integer":123,"number":100.02,"boolean":false,"null":null,"array":["this is a string",123,100.02,true,null],"object":{}}}'
      });
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
    await expect(readFile(join(dir, "samconfig.toml"), { encoding: "utf8" }))
      .resolves.toEqual(`version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
${expectedParameterOverrides}`);
  });

  test("for no parameters and no prior samconfig.toml", async () => {
    mockedFunction(generateSamConfigParameterOverrides).mockResolvedValue({});
    await expect(
      generateSAMConfigToml(dir, ["somod"])
    ).resolves.toBeUndefined();
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledTimes(1);
    expect(generateSamConfigParameterOverrides).toHaveBeenCalledWith(dir, [
      "somod"
    ]);
    expect(existsSync(join(dir, "samconfig.toml"))).not.toBeTruthy();
  });

  test("for samconfig.toml containing no parameter_overrides", async () => {
    createFiles(dir, {
      "samconfig.toml": defaultSamConfigContent
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
      `${defaultSamConfigContent}${expectedParameterOverrides}`
    );
  });

  test("for no parameters and samconfig.toml containing no parameter_overrides", async () => {
    mockedFunction(generateSamConfigParameterOverrides).mockResolvedValue({});
    createFiles(dir, {
      "samconfig.toml": defaultSamConfigContent
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
    ).resolves.toEqual(defaultSamConfigContent);
  });

  test("for samconfig.toml containing prior parameter_overrides", async () => {
    createFiles(dir, {
      "samconfig.toml": `${defaultSamConfigContent}parameter_overrides = "Param1=\\"Hah\\""\nimage_repositories = []\n`
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
      `${defaultSamConfigContent}${expectedParameterOverrides}\nimage_repositories = []\n`
    );
  });

  test("for no parameters and samconfig.toml containing prior parameter_overrides", async () => {
    mockedFunction(generateSamConfigParameterOverrides).mockResolvedValue({});
    createFiles(dir, {
      "samconfig.toml": `${defaultSamConfigContent}parameter_overrides = "Param1=\\"Hah\\""\nimage_repositories = []\n`
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
      `${defaultSamConfigContent}parameter_overrides = "Param1=\\"Hah\\""\nimage_repositories = []\n`
    );
  });
});
