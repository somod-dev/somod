import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { ErrorSet } from "@solib/cli-base";
import { existsSync } from "fs";
import { dump } from "js-yaml";
import { join } from "path";
import { validateSchema } from "../../../../src/tasks/serverless/validateSchema";
import { buildTemplateYaml } from "../../../../src/utils/serverless/buildTemplateYaml";
import {
  doublePackageJson,
  functionDefaults,
  installSchemaInTempDir,
  moduleIndicators
} from "../utils";

describe("test keyword SOMOD::Access", () => {
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

  test("with dependsOn a resource with only module access", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SOMOD::DependsOn": [
            {
              module: "@my-scope/sample2",
              resource: "Resource2"
            }
          ]
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource2: {
              Type: "AWS::Serverless::Function",
              Properties: { ...functionDefaults },
              "SOMOD::Access": "module"
            }
          }
        })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir, moduleIndicators)).rejects.toEqual(
      new ErrorSet([
        new Error(
          'Referenced module resource {@my-scope/sample2, Resource2} can not be accessed (has "module" access). Referenced in "@my-scope/sample" at "Resources/Resource1"'
        )
      ])
    );
    expect(existsSync(buildTemplateJsonPath)).not.toBeTruthy();
  });

  test("with extending a resource with only module access", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: { ...functionDefaults },
          "SOMOD::Extend": {
            module: "@my-scope/sample2",
            resource: "Resource2"
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource2: {
              Type: "AWS::Serverless::Function",
              Properties: { ...functionDefaults },
              "SOMOD::Access": "module"
            }
          }
        })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir, moduleIndicators)).rejects.toEqual(
      new ErrorSet([
        new Error(
          'Referenced module resource {@my-scope/sample2, Resource2} can not be accessed (has "module" access). Referenced in "@my-scope/sample" at "Resources/Resource1"'
        )
      ])
    );
    expect(existsSync(buildTemplateJsonPath)).not.toBeTruthy();
  });

  test("with referencing a resource with only module access", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${resource2}",
                {
                  resource2: {
                    "SOMOD::Ref": {
                      module: "@my-scope/sample2",
                      resource: "Resource2"
                    }
                  }
                }
              ]
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource2: {
              Type: "AWS::Serverless::Api",
              Properties: { Name: { "SOMOD::ResourceName": "restapi" } },
              "SOMOD::Access": "module"
            }
          }
        })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir, moduleIndicators)).rejects.toEqual(
      new ErrorSet([
        new Error(
          'Referenced module resource {@my-scope/sample2, Resource2} can not be accessed (has "module" access). Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/resource2"'
        )
      ])
    );
    expect(existsSync(buildTemplateJsonPath)).not.toBeTruthy();
  });

  test("with referencing a resource-name with only module access", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${restApiName}",
                {
                  restApiName: {
                    "SOMOD::RefResourceName": {
                      module: "@my-scope/sample2",
                      resource: "Resource2",
                      property: "Name"
                    }
                  }
                }
              ]
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      ...doublePackageJson,
      "node_modules/@my-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource2: {
              Type: "AWS::Serverless::Api",
              Properties: { Name: { "SOMOD::ResourceName": "restapi" } },
              "SOMOD::Access": "module"
            }
          }
        })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir, moduleIndicators)).rejects.toEqual(
      new ErrorSet([
        new Error(
          'Referenced module resource {@my-scope/sample2, Resource2} can not be accessed (has "module" access). Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/restApiName"'
        )
      ])
    );
    expect(existsSync(buildTemplateJsonPath)).not.toBeTruthy();
  });

  test("with referencing a resource with only scope access from a different scope", async () => {
    const template = {
      Resources: {
        Resource1: {
          Type: "AWS::Serverless::Function",
          Properties: {
            ...functionDefaults,
            Description: {
              "Fn::Sub": [
                "Invoked from ${resource2}",
                {
                  resource2: {
                    "SOMOD::Ref": {
                      module: "@another-scope/sample2",
                      resource: "Resource2"
                    }
                  }
                }
              ]
            }
          }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(template),
      "package.json": JSON.stringify({
        name: "@my-scope/sample",
        version: "1.0.0",
        dependencies: { "@another-scope/sample2": "^1.0.0" },
        somod: "1.3.2"
      }),
      "node_modules/@another-scope/sample2/package.json": JSON.stringify({
        name: "@another-scope/sample2",
        version: "1.0.0",
        dependencies: {},
        somod: "1.3.2"
      }),
      "node_modules/@another-scope/sample2/build/serverless/template.json":
        JSON.stringify({
          Resources: {
            Resource2: {
              Type: "AWS::Serverless::Api",
              Properties: { Name: { "SOMOD::ResourceName": "restapi" } },
              "SOMOD::Access": "scope"
            }
          }
        })
    });
    await validateSchema(dir); // make sure schema is right
    await expect(buildTemplateYaml(dir, moduleIndicators)).rejects.toEqual(
      new ErrorSet([
        new Error(
          'Referenced module resource {@another-scope/sample2, Resource2} can not be accessed (has "scope" access). Referenced in "@my-scope/sample" at "Resources/Resource1/Properties/Description/Fn::Sub/1/resource2"'
        )
      ])
    );
    expect(existsSync(buildTemplateJsonPath)).not.toBeTruthy();
  });
});
