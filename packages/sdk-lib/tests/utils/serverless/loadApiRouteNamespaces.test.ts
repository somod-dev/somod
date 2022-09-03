import { createFiles, createTempDir, deleteDir } from "../../utils";

import { loadApiRouteNamespaces } from "../../../src/utils/serverless/namespace";
import { cloneDeep } from "lodash";
import { dump } from "js-yaml";
import { namespace_api_gateway } from "../../../src";
import { keywordRef } from "../../../src/utils/serverless/keywords/ref";
import { Module } from "@somod/types";

describe("Test util serverless.loadApiRouteNamespaces", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const getModuleTemplate = (directory: string): Module => ({
    name: "my-module",
    version: "1.0.0",
    packageLocation: directory,
    namespaces: {}
  });

  test("with no serverless directory", async () => {
    createFiles(dir, { "build/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadApiRouteNamespaces(module)).resolves.toEqual({});
  });

  test("with empty serverless directory", async () => {
    createFiles(dir, { "build/serverless/": "" });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadApiRouteNamespaces(module)).resolves.toEqual({});
  });

  test("with no http Api", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({ Resources: {} })
    });
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(loadApiRouteNamespaces(module)).resolves.toEqual({});
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
                    Path: "my-resourceType/getresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
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
    await expect(loadApiRouteNamespaces(module)).resolves.toEqual({
      [`${namespace_api_gateway} my-module MyApi1`]: [
        "GET my-resourceType/getresource"
      ]
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
                    Path: "my-resourceType/getresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
                  }
                },
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
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
                    Path: "my-another-resourceType/post",
                    ApiId: {
                      [keywordRef.keyword]: {
                        module: "my-another-module",
                        resource: "MyApi1"
                      }
                    }
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
    await expect(loadApiRouteNamespaces(module)).resolves.toEqual({
      [`${namespace_api_gateway} my-module MyApi1`]: [
        "GET my-resourceType/getresource",
        "POST my-resourceType/postresource"
      ],
      [`${namespace_api_gateway} my-another-module MyApi1`]: [
        "POST my-another-resourceType/post"
      ]
    });
  });

  test("with multiple http and rest apis", async () => {
    createFiles(dir, {
      "build/serverless/template.json": JSON.stringify({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              CodeUri: "",
              Events: {
                Get: {
                  Type: "Api",
                  Properties: {
                    Method: "GET",
                    Path: "my-resourceType/getresource",
                    RestApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyRestApi1"
                      }
                    }
                  }
                },
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
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
                  Type: "Api",
                  Properties: {
                    Method: "POST",
                    Path: "my-another-resourceType/post",
                    RestApiId: {
                      [keywordRef.keyword]: {
                        module: "my-another-module",
                        resource: "MyRestApi1"
                      }
                    }
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
    await expect(loadApiRouteNamespaces(module)).resolves.toEqual({
      [`${namespace_api_gateway} my-module MyRestApi1`]: [
        "GET my-resourceType/getresource"
      ],
      [`${namespace_api_gateway} my-module MyApi1`]: [
        "POST my-resourceType/postresource"
      ],
      [`${namespace_api_gateway} my-another-module MyRestApi1`]: [
        "POST my-another-resourceType/post"
      ]
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
                    Path: "my-resourceType/getresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
                  }
                },
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
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
                    Path: "my-resourceType/get",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
                  }
                },
                Put: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "PUT",
                    Path: "my-resourceType/put",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    //@ts-expect-error this is fine during test
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(loadApiRouteNamespaces(module)).resolves.toEqual({
      [`${namespace_api_gateway} my-module MyApi1`]: [
        "GET my-resourceType/getresource",
        "POST my-resourceType/postresource"
      ]
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
                    Path: "my-resourceType/getresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
                  }
                },
                Post: {
                  Type: "HttpApi",
                  Properties: {
                    Method: "POST",
                    Path: "my-resourceType/postresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
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
                    Path: "my-resourceType/postresource",
                    ApiId: {
                      [keywordRef.keyword]: {
                        resource: "MyApi1"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
    });
    const moduleTemplate = getModuleTemplate(dir);
    //@ts-expect-error this is fine during test
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(loadApiRouteNamespaces(module)).rejects.toEqual(
      new Error(`Following routes for Serverless Api Gateway my-module MyApi1 are repeated in my-module
 - POST my-resourceType/postresource`)
    );
  });
});
