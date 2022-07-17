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

describe("test keyword SOMOD::FunctionLayerLibraries", () => {
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

  test("with SOMOD::FunctionLayerLibraries", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::LayerVersion",
          Properties: {
            CompatibleArchitectures: ["arm64"],
            CompatibleRuntimes: ["nodejs14.x"],
            LayerName: {
              "SOMOD::ResourceName": "mylayer"
            },
            "SOMOD::FunctionLayerLibraries": ["smallest"],
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
    await expect(
      readFile(
        join(
          dir,
          path_build,
          path_serverless,
          path_functionLayers,
          "mylayer",
          "nodejs",
          "package.json"
        ),
        { encoding: "utf8" }
      )
    ).resolves.toEqual(
      JSON.stringify(
        {
          name: "@my-scope/sample-mylayer",
          version: "1.0.0",
          description: "Lambda function layer - mylayer",
          dependencies: {
            smallest: "^1.0.1"
          }
        },
        null,
        2
      )
    );
  });
});
