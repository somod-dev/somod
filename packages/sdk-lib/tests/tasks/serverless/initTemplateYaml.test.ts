import { readFile } from "fs/promises";
import { join } from "path";
import { initTemplateYaml } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task initTemplateYaml", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no template.yaml", async () => {
    await expect(initTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "serverless/template.yaml"), { encoding: "utf8" })
    ).resolves
      .toEqual(`# yaml-language-server: $schema=../node_modules/@somod/serverless-schema/schemas/index.json

Resources:
  SampleParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: Hello
      Description: "TODO${":"} This is a sample resource, Delete this and add the valid resources for your module"
      Type: String
      Value: Good Luck

`);
  });

  test("for prior template.yaml", async () => {
    createFiles(dir, { "serverless/template.yaml": "" });
    await expect(initTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "serverless/template.yaml"), { encoding: "utf8" })
    ).resolves.toEqual("");
  });
});
