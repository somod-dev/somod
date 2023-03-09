import { createTempDir, deleteDir } from "../../utils";

import { cloneDeep } from "lodash";
import { IContext, Module } from "somod-types";
import { namespace_api_gateway } from "../../../src";
import { keywordRef } from "../../../src/utils/serverless/keywords/ref";
import { loadApiRouteNamespaces } from "../../../src/utils/serverless/namespace";

describe("Test util serverless.loadApiRouteNamespaces", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const getModuleTemplate = (directory: string): Module => ({
    name: "my-module",
    version: "1.0.0",
    packageLocation: directory
  });

  test("with no template", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadApiRouteNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() =>
            null) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([]);
  });

  test("with no http Api", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadApiRouteNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: { Resources: {} }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([]);
  });

  test("with one http Api", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadApiRouteNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: {
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
            }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: `${namespace_api_gateway} my-module MyApi1`,
        values: ["GET my-resourceType/getresource"]
      }
    ]);
  });

  test("with multiple http Api", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadApiRouteNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: {
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
            }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: `${namespace_api_gateway} my-module MyApi1`,
        values: [
          "GET my-resourceType/getresource",
          "POST my-resourceType/postresource"
        ]
      },
      {
        name: `${namespace_api_gateway} my-another-module MyApi1`,
        values: ["POST my-another-resourceType/post"]
      }
    ]);
  });

  test("with multiple http and rest apis", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadApiRouteNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: {
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
            }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: `${namespace_api_gateway} my-module MyRestApi1`,
        values: ["GET my-resourceType/getresource"]
      },
      {
        name: `${namespace_api_gateway} my-module MyApi1`,
        values: ["POST my-resourceType/postresource"]
      },
      {
        name: `${namespace_api_gateway} my-another-module MyRestApi1`,
        values: ["POST my-another-resourceType/post"]
      }
    ]);
  });

  test("with http Api in root dir", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    //@ts-expect-error this is fine during test
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadApiRouteNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: {
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
            }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).resolves.toEqual([
      {
        name: `${namespace_api_gateway} my-module MyApi1`,
        values: [
          "GET my-resourceType/getresource",
          "POST my-resourceType/postresource"
        ]
      }
    ]);
  });

  test("with repeated http Api in same module", async () => {
    const moduleTemplate = getModuleTemplate(dir);
    //@ts-expect-error this is fine during test
    moduleTemplate.root = true;
    const module = cloneDeep(moduleTemplate);
    await expect(
      loadApiRouteNamespaces(module, {
        serverlessTemplateHandler: {
          getTemplate: (() => ({
            module: "my-module",
            template: {
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
            }
          })) as IContext["serverlessTemplateHandler"]["getTemplate"]
        }
      } as IContext)
    ).rejects.toEqual(
      new Error(`Following routes for Serverless Api Gateway my-module MyApi1 are repeated in my-module
 - POST my-resourceType/postresource`)
    );
  });
});
