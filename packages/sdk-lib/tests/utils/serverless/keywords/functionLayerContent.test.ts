import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import {
  path_build,
  path_functionLayers,
  path_serverless
} from "../../../../src/utils/constants";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateYaml } from "../../../../src/utils/serverless/buildTemplateYaml";
import { installSchemaInTempDir, StringifyTemplate } from "../utils";
import { existsSync } from "fs";

describe("test keyword SOMOD::FunctionLayerContent", () => {
  let dir: string = null;
  let buildTemplateJsonPath = null;

  beforeEach(async () => {
    dir = createTempDir();
    buildTemplateJsonPath = join(dir, "build", "serverless", "template.json");
    await installSchemaInTempDir(dir);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("without SOMOD::FunctionLayerContent and SOMOD::FunctionLayerLibraries", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            CompatibleArchitectures: ["arm64"],
            LayerName: {
              "SOMOD::ResourceName": "mylayer"
            },
            RetentionPolicy: "Delete"
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "@my-scope/sample",
        version: "1.0.0",
        devDependencies: {
          smallest: "^1.0.1"
        },
        somod: "1.3.2"
      })
    });

    await expect(validateSchema(dir)).rejects.toMatchInlineSnapshot(`
            [Error: ${join(
              dir,
              "serverless/template.yaml"
            )} has following errors
             Resources.Resource1 When not extended, Properties must have LayerName, RetentionPolicy and either of SOMOD::FunctionLayerLibraries or SOMOD::FunctionLayerContent]
          `);
  });

  test("with only SOMOD::FunctionLayerContent", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            CompatibleArchitectures: ["arm64"],
            LayerName: {
              "SOMOD::ResourceName": "mylayer"
            },
            "SOMOD::FunctionLayerContent": {
              "nodejs/dynamic-layer-content": '{"a":1}'
            },
            RetentionPolicy: "Delete"
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "@my-scope/sample",
        version: "1.0.0",
        devDependencies: {
          smallest: "^1.0.1"
        },
        somod: "1.3.2"
      })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir)).resolves.toBeUndefined();
    await expect(
      readFile(buildTemplateJsonPath, { encoding: "utf8" })
    ).resolves.toEqual(StringifyTemplate(template));
    expect(
      existsSync(
        join(dir, path_build, path_serverless, path_functionLayers, "mylayer")
      )
    ).not.toBeTruthy();
  });
});
