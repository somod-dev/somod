import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { buildServerlessTemplate } from "../../../src";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { loadParameterNamespaces } from "../../../src/utils/parameters/namespace";
import { createFiles, createTempDir, deleteDir } from "../../utils";
describe("Test Task buildServerlessTemplate", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir("test-somod-lib");
    ModuleHandler.initialize(dir, [loadParameterNamespaces]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no serverless directory", async () => {
    await expect(buildServerlessTemplate(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("For no template", async () => {
    createFiles(dir, {
      "serverless/": ""
    });
    await expect(buildServerlessTemplate(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("For simple template", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SOMOD::Ref": {
                      resource: "Resource2",
                      attribute: "Name"
                    }
                  }
                }
              ]
            },
            Events: {
              ApiEvent: {
                Type: "Api",
                Properties: {
                  RestApiId: {
                    "SOMOD::Ref": {
                      resource: "Resource2"
                    }
                  }
                }
              }
            }
          }
        },
        Resource2: {
          Type: "AWS::Serverless::Api",
          Properties: {},
          "SOMOD::Output": {
            default: true,
            attributes: ["Name"]
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: {},
        somod: "1.3.2"
      })
    });
    await expect(buildServerlessTemplate(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build", "serverless", "template.json"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(JSON.stringify(template));
  });
});
