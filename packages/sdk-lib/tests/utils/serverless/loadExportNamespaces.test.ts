import { createFiles, createTempDir, deleteDir } from "../../utils";

import { loadExportParameterNamespaces } from "../../../src/utils/serverless/namespace";
import { Module } from "../../../src/utils/moduleHandler";
import { cloneDeep } from "lodash";
import { dump } from "js-yaml";

describe("Test util serverless.loadExportParameterNamespaces", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const getModuleTemplate = (directory: string): Module => ({
    type: "slp",
    name: "my-module",
    version: "1.0.0",
    packageLocation: directory,
    namespaces: {}
  });

  test("with no serverless directory", async () => {
    createFiles(dir, { "build/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadExportParameterNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "Serverless Export Parameter": [] }
    });
  });

  test("with empty serverless directory", async () => {
    createFiles(dir, { "build/serverless/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadExportParameterNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "Serverless Export Parameter": [] }
    });
  });

  test("with no export parameter", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({ Resources: {} })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadExportParameterNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "Serverless Export Parameter": [] }
    });
  });

  test("with one export parameter", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            "SLP::Output": {
              default: true,
              attributes: ["Arn"],
              export: {
                default: "my-function-name"
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadExportParameterNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: {
        "Serverless Export Parameter": ["my-function-name"]
      }
    });
  });

  test("with multiple export parameters", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            "SLP::Output": {
              default: true,
              attributes: ["Arn"],
              export: {
                default: "my-function-name",
                Arn: "my-function-arn"
              }
            }
          },
          MyAnotherLambda: {
            Type: "AWS::Serverless::Function",
            "SLP::Output": {
              default: true,
              attributes: ["Arn"],
              export: {
                Arn: "my-another-function-arn"
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadExportParameterNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: {
        "Serverless Export Parameter": [
          "my-function-name",
          "my-function-arn",
          "my-another-function-arn"
        ]
      }
    });
  });

  test("with export parameter in root dir", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            "SLP::Output": {
              default: true,
              attributes: ["Arn"],
              export: {
                default: "my-function-name",
                Arn: "my-function-arn"
              }
            }
          }
        }
      }),
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            "SLP::Output": {
              default: true,
              attributes: ["Arn"],
              export: {
                Arn: "function-arn"
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await loadExportParameterNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: {
        "Serverless Export Parameter": ["my-function-name", "my-function-arn"]
      }
    });
  });

  test("with repeated export parameter in same module", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            "SLP::Output": {
              default: true,
              attributes: ["Arn"],
              export: {
                default: "my-function-name",
                Arn: "my-function-arn"
              }
            }
          },
          MyAnotherLambda: {
            Type: "AWS::Serverless::Function",
            "SLP::Output": {
              default: true,
              attributes: ["Arn"],
              export: {
                default: "my-function-name",
                Arn: "function-arn"
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(loadExportParameterNamespaces(module)).rejects.toEqual(
      new Error(`Following Serverless Export Parameter are repeated in my-module
 - my-function-name`)
    );
  });
});
