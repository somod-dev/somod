import { createFiles, createTempDir, deleteDir } from "../../utils";

import { loadHttpApiNamespaces } from "../../../src/utils/serverless/namespace";
import { Module } from "../../../src/utils/moduleHandler";
import { cloneDeep } from "lodash";
import { dump } from "js-yaml";

describe("Test util serverless.loadHttpApiNamespaces", () => {
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
    await loadHttpApiNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "Serverless Http Api": [] }
    });
  });

  test("with empty serverless directory", async () => {
    createFiles(dir, { "build/serverless/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadHttpApiNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "Serverless Http Api": [] }
    });
  });

  test("with no http Api", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({ Resources: {} })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadHttpApiNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "Serverless Http Api": [] }
    });
  });

  test("with one http Api", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Get: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "GET",
                    Path: "my-resourceType/getresource"
                  }
                }
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadHttpApiNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: { "Serverless Http Api": ["GET my-resourceType/getresource"] }
    });
  });

  test("with multiple http Api", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Get: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "GET",
                    Path: "my-resourceType/getresource"
                  }
                },
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource"
                  }
                }
              }
            }
          },
          MyAnotherLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-another-resourceType/post"
                  }
                }
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await loadHttpApiNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: {
        "Serverless Http Api": [
          "GET my-resourceType/getresource",
          "POST my-resourceType/postresource",
          "POST my-another-resourceType/post"
        ]
      }
    });
  });

  test("with http Api in root dir", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Get: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "GET",
                    Path: "my-resourceType/getresource"
                  }
                },
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource"
                  }
                }
              }
            }
          }
        }
      }),
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Get: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "GET",
                    Path: "my-resourceType/get"
                  }
                },
                Put: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "PUT",
                    Path: "my-resourceType/put"
                  }
                }
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await loadHttpApiNamespaces(module);
    expect(module).toEqual({
      ...moduleTemplate,
      namespaces: {
        "Serverless Http Api": [
          "GET my-resourceType/getresource",
          "POST my-resourceType/postresource"
        ]
      }
    });
  });

  test("with repeated http Api in same module", async () => {
    createFiles(dir, {
      "serverless/template.yaml": dump({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Get: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "GET",
                    Path: "my-resourceType/getresource"
                  }
                },
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource"
                  }
                }
              }
            }
          },
          MyAnotherLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource"
                  }
                }
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(loadHttpApiNamespaces(module)).rejects.toEqual(
      new Error(`Following Serverless Http Api are repeated in my-module
 - POST my-resourceType/postresource`)
    );
  });
});
