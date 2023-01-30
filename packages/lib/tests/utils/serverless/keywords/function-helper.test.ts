import { IContext, IExtensionHandler, ServerlessTemplate } from "somod-types";
import {
  resourceType_Function,
  resourceType_FunctionLayer,
  resourceType_FunctionMiddleware
} from "../../../../src";
import { ExtendUtil } from "../../../../src/utils/serverless/keywords/extend-helper";
import { MergedFunctionResourceContainer } from "../../../../src/utils/serverless/keywords/function-helper";

type Module = {
  name: string;
  dependencies?: string[];
  extension?: { layers?: string[]; middlewares?: string[] };
  template: ServerlessTemplate;
};

export const getContext = (modules: Module[]) => {
  const templateMap = Object.fromEntries(
    modules.map(m => [m.name, m.template])
  );
  const resourceMap = ExtendUtil.getResourceMap(templateMap);
  const extensionFunctionLayers: IExtensionHandler["functionLayers"] = [];
  const extensionFunctionMiddlewares: IExtensionHandler["functionMiddlewares"] =
    [];

  modules.forEach(module => {
    if (module.extension?.layers) {
      const fnLayer: IExtensionHandler["functionLayers"][number] = {
        extension: module.name,
        value: module.extension.layers
      };
      extensionFunctionLayers.push(fnLayer);
    }
    if (module.extension?.middlewares) {
      const fnMiddleware: IExtensionHandler["functionMiddlewares"][number] = {
        extension: module.name,
        value: module.extension.middlewares
      };
      extensionFunctionMiddlewares.push(fnMiddleware);
    }
  });

  return {
    serverlessTemplateHandler: {
      getTemplate: module => ({ module, template: templateMap[module] }),
      getResource: (module, resource) => resourceMap[module][resource],
      getResourcePropertySource: ExtendUtil.getResourcePropertySource
    },
    extensionHandler: {
      functionLayers: extensionFunctionLayers,
      functionMiddlewares: extensionFunctionMiddlewares
    }
  } as IContext;
};

describe("test the helper for keyword function", () => {
  afterEach(() => {
    MergedFunctionResourceContainer["store"] = {};
  });

  test("A function without any properties", async () => {
    await expect(
      MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: { f0: { Type: resourceType_Function, Properties: {} } }
            }
          }
        ]),
        "m0",
        "f0"
      )
    ).rejects.toEqual(
      new Error(
        "Function Resource {m0, f0} must contain SOMOD::Function keyword in its CodeUri Property"
      )
    );
  });

  test("A extended function", async () => {
    await expect(
      MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  "SOMOD::Extend": { module: "m1", resource: "f1" },
                  Properties: {}
                }
              }
            },
            dependencies: ["m1"]
          },
          {
            name: "m1",
            template: {
              Resources: {
                f1: {
                  Type: resourceType_Function,
                  Properties: {}
                }
              }
            }
          }
        ]),
        "m0",
        "f0"
      )
    ).rejects.toEqual(
      new Error(
        "Function Resource {m0, f0} must not contain SOMOD::Extend keyword"
      )
    );
  });

  test("A non function type", async () => {
    await expect(
      MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: "MyFunctionType",
                  Properties: {}
                }
              }
            }
          }
        ]),
        "m0",
        "f0"
      )
    ).rejects.toEqual(
      new Error(
        "Function Resource {m0, f0} must be of type AWS::Serverless::Function"
      )
    );
  });

  test("A non-existing function", async () => {
    await expect(
      MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {}
                }
              }
            }
          }
        ]),
        "m0",
        "f1"
      )
    ).rejects.toEqual(new Error("Function Resource {m0, f1} does not exist."));
  });

  test("A simple valid function", async () => {
    const mergedFunction =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": { name: "my-function" }
                    }
                  }
                }
              }
            }
          }
        ]),
        "m0",
        "f0"
      );
    expect(mergedFunction).toMatchInlineSnapshot(`
      Object {
        "code": Object {
          "function": Object {
            "module": "m0",
            "name": "my-function",
          },
          "middlewares": Array [],
        },
        "resource": Object {
          "Properties": Object {
            "CodeUri": Object {
              "SOMOD::Function": Object {
                "middlewares": Array [],
                "name": "my-function",
              },
            },
            "Layers": Array [],
          },
          "Type": "AWS::Serverless::Function",
        },
      }
    `);
  });

  test("A valid extended function", async () => {
    const mergedFunction =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": { name: "my-function" }
                    }
                  }
                }
              }
            }
          },
          {
            name: "m1",
            template: {
              Resources: {
                f1: {
                  Type: resourceType_Function,
                  "SOMOD::Extend": { module: "m0", resource: "f0" },
                  Properties: {
                    Layers: [{ "SOMOD::Ref": { resource: "l1" } }]
                  }
                },
                l1: {
                  Type: resourceType_FunctionLayer,
                  Properties: {}
                }
              }
            },
            dependencies: ["m0"]
          }
        ]),
        "m0",
        "f0"
      );
    expect(mergedFunction).toMatchInlineSnapshot(`
      Object {
        "code": Object {
          "function": Object {
            "module": "m0",
            "name": "my-function",
          },
          "middlewares": Array [],
        },
        "resource": Object {
          "Properties": Object {
            "CodeUri": Object {
              "SOMOD::Function": Object {
                "middlewares": Array [],
                "name": "my-function",
              },
            },
            "Layers": Array [
              Object {
                "SOMOD::Ref": Object {
                  "module": "m1",
                  "resource": "l1",
                },
              },
            ],
          },
          "Type": "AWS::Serverless::Function",
        },
      }
    `);
  });

  test("A valid extended function which changes code", async () => {
    const mergedFunction =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": { name: "my-function" }
                    }
                  }
                }
              }
            }
          },
          {
            name: "m1",
            template: {
              Resources: {
                f1: {
                  Type: resourceType_Function,
                  "SOMOD::Extend": { module: "m0", resource: "f0" },
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": { name: "my-function-from-m1" }
                    }
                  }
                }
              }
            },
            dependencies: ["m0"]
          }
        ]),
        "m0",
        "f0"
      );
    expect(mergedFunction).toMatchInlineSnapshot(`
      Object {
        "code": Object {
          "function": Object {
            "module": "m1",
            "name": "my-function-from-m1",
          },
          "middlewares": Array [],
        },
        "resource": Object {
          "Properties": Object {
            "CodeUri": Object {
              "SOMOD::Function": Object {
                "middlewares": Array [],
                "name": "my-function-from-m1",
              },
            },
            "Layers": Array [],
          },
          "Type": "AWS::Serverless::Function",
        },
      }
    `);
  });

  test("A valid extended function which changes environmental variables", async () => {
    const mergedFunction =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": { name: "my-function" }
                    },
                    Environment: {
                      Variables: {
                        MY_VAR1: { "SOMOD::Parameter": "my.var1" },
                        MY_VAR2: { "SOMOD::Parameter": "my.var2" }
                      }
                    }
                  }
                }
              }
            }
          },
          {
            name: "m1",
            template: {
              Resources: {
                f1: {
                  Type: resourceType_Function,
                  "SOMOD::Extend": { module: "m0", resource: "f0" },
                  Properties: {
                    Environment: {
                      Variables: {
                        MY_VAR1: { "SOMOD::Parameter": "my.var1.from.m1" },
                        MY_VAR3: "hardcoded_env"
                      }
                    }
                  }
                }
              }
            },
            dependencies: ["m0"]
          }
        ]),
        "m0",
        "f0"
      );
    expect(mergedFunction).toMatchInlineSnapshot(`
      Object {
        "code": Object {
          "function": Object {
            "module": "m0",
            "name": "my-function",
          },
          "middlewares": Array [],
        },
        "resource": Object {
          "Properties": Object {
            "CodeUri": Object {
              "SOMOD::Function": Object {
                "middlewares": Array [],
                "name": "my-function",
              },
            },
            "Environment": Object {
              "Variables": Object {
                "MY_VAR1": Object {
                  "SOMOD::Parameter": "my.var1.from.m1",
                },
                "MY_VAR2": Object {
                  "SOMOD::Parameter": "my.var2",
                },
                "MY_VAR3": "hardcoded_env",
              },
            },
            "Layers": Array [],
          },
          "Type": "AWS::Serverless::Function",
        },
      }
    `);
  });

  test("with middlewares in original function resource", async () => {
    const mergedFunction =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m-1",
            template: {
              Resources: {
                "middleware-1": {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": {
                        name: "my-middleware-1-code"
                      }
                    },
                    Layers: [{ "SOMOD::Ref": { resource: "l-1" } }]
                  }
                },
                "l-1": {
                  Type: resourceType_FunctionLayer,
                  Properties: {}
                }
              }
            }
          },
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": {
                        name: "my-function",
                        middlewares: [
                          { resource: "middleware0" },
                          { module: "m-1", resource: "middleware-1" }
                        ]
                      }
                    },
                    Environment: {
                      Variables: {
                        MY_VAR1: { "SOMOD::Parameter": "my.var1" },
                        MY_VAR2: { "SOMOD::Parameter": "my.var2" }
                      }
                    }
                  }
                },
                middleware0: {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": {
                        name: "my-middleware0-code"
                      }
                    },
                    Environment: {
                      Variables: {
                        MY_VAR3: { "SOMOD::Ref": { resource: "r0" } }
                      }
                    }
                  }
                },
                r0: {
                  Type: "",
                  Properties: {}
                }
              }
            },
            dependencies: ["m-1"]
          }
        ]),
        "m0",
        "f0"
      );
    expect(mergedFunction).toMatchInlineSnapshot(`
      Object {
        "code": Object {
          "function": Object {
            "module": "m0",
            "name": "my-function",
          },
          "middlewares": Array [
            Object {
              "module": "m0",
              "name": "my-middleware0-code",
            },
            Object {
              "module": "m-1",
              "name": "my-middleware-1-code",
            },
          ],
        },
        "resource": Object {
          "Properties": Object {
            "CodeUri": Object {
              "SOMOD::Function": Object {
                "middlewares": Array [
                  Object {
                    "module": "m0",
                    "resource": "middleware0",
                  },
                  Object {
                    "module": "m-1",
                    "resource": "middleware-1",
                  },
                ],
                "name": "my-function",
              },
            },
            "Environment": Object {
              "Variables": Object {
                "MY_VAR1": Object {
                  "SOMOD::Parameter": "my.var1",
                },
                "MY_VAR2": Object {
                  "SOMOD::Parameter": "my.var2",
                },
                "MY_VAR3": Object {
                  "SOMOD::Ref": Object {
                    "module": "m0",
                    "resource": "r0",
                  },
                },
              },
            },
            "Layers": Array [
              Object {
                "SOMOD::Ref": Object {
                  "module": "m-1",
                  "resource": "l-1",
                },
              },
            ],
          },
          "Type": "AWS::Serverless::Function",
        },
      }
    `);
  });

  test("with middlewares in extended function resource", async () => {
    const mergedFunction =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m-1",
            template: {
              Resources: {
                "middleware-1": {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": {
                        name: "my-middleware-1-code"
                      }
                    },
                    Layers: [{ "SOMOD::Ref": { resource: "l-1" } }]
                  }
                },
                "l-1": {
                  Type: resourceType_FunctionLayer,
                  Properties: {}
                }
              }
            }
          },
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": {
                        name: "my-function",
                        middlewares: [
                          { resource: "middleware0" },
                          { module: "m-1", resource: "middleware-1" }
                        ]
                      }
                    },
                    Environment: {
                      Variables: {
                        MY_VAR1: { "SOMOD::Parameter": "my.var1" },
                        MY_VAR2: { "SOMOD::Parameter": "my.var2" }
                      }
                    }
                  }
                },
                middleware0: {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": {
                        name: "my-middleware0-code"
                      }
                    },
                    Environment: {
                      Variables: {
                        MY_VAR3: { "SOMOD::Ref": { resource: "r0" } }
                      }
                    }
                  }
                },
                r0: {
                  Type: "",
                  Properties: {}
                }
              }
            },
            dependencies: ["m-1"]
          },
          {
            name: "m1",
            template: {
              Resources: {
                f1: {
                  Type: resourceType_Function,
                  "SOMOD::Extend": {
                    module: "m0",
                    resource: "f0",
                    rules: {
                      '$.CodeUri["SOMOD::Function"].middlewares': "APPEND"
                    }
                  },
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": {
                        middlewares: [{ resource: "middleware1" }]
                      }
                    }
                  }
                },
                middleware1: {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": { name: "middleware1-code" }
                    },
                    Environment: { Variables: { MY_VAR4: "hardcoded" } },
                    Layers: [{ "SOMOD::Ref": { resource: "l1" } }]
                  }
                },
                l1: {
                  Type: resourceType_FunctionLayer,
                  Properties: {}
                }
              }
            },
            dependencies: ["m0"]
          }
        ]),
        "m0",
        "f0"
      );
    expect(mergedFunction).toMatchInlineSnapshot(`
      Object {
        "code": Object {
          "function": Object {
            "module": "m0",
            "name": "my-function",
          },
          "middlewares": Array [
            Object {
              "module": "m0",
              "name": "my-middleware0-code",
            },
            Object {
              "module": "m-1",
              "name": "my-middleware-1-code",
            },
            Object {
              "module": "m1",
              "name": "middleware1-code",
            },
          ],
        },
        "resource": Object {
          "Properties": Object {
            "CodeUri": Object {
              "SOMOD::Function": Object {
                "middlewares": Array [
                  Object {
                    "module": "m0",
                    "resource": "middleware0",
                  },
                  Object {
                    "module": "m-1",
                    "resource": "middleware-1",
                  },
                  Object {
                    "module": "m1",
                    "resource": "middleware1",
                  },
                ],
                "name": "my-function",
              },
            },
            "Environment": Object {
              "Variables": Object {
                "MY_VAR1": Object {
                  "SOMOD::Parameter": "my.var1",
                },
                "MY_VAR2": Object {
                  "SOMOD::Parameter": "my.var2",
                },
                "MY_VAR3": Object {
                  "SOMOD::Ref": Object {
                    "module": "m0",
                    "resource": "r0",
                  },
                },
                "MY_VAR4": "hardcoded",
              },
            },
            "Layers": Array [
              Object {
                "SOMOD::Ref": Object {
                  "module": "m-1",
                  "resource": "l-1",
                },
              },
              Object {
                "SOMOD::Ref": Object {
                  "module": "m1",
                  "resource": "l1",
                },
              },
            ],
          },
          "Type": "AWS::Serverless::Function",
        },
      }
    `);
  });

  test("extension adding middleware and layers", async () => {
    const mergedFunction =
      await MergedFunctionResourceContainer.getFinalFunctionResource(
        getContext([
          {
            name: "m0",
            template: {
              Resources: {
                f0: {
                  Type: resourceType_Function,
                  Properties: {
                    CodeUri: {
                      "SOMOD::Function": {
                        name: "my-function",
                        middlewares: [{ resource: "middleware0" }]
                      }
                    },
                    Environment: {
                      Variables: {
                        MY_VAR1: { "SOMOD::Parameter": "my.var1" },
                        MY_VAR2: { "SOMOD::Parameter": "my.var2" }
                      }
                    }
                  }
                },
                middleware0: {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": {
                        name: "my-middleware0-code"
                      }
                    },
                    Environment: {
                      Variables: {
                        MY_VAR3: { "SOMOD::Ref": { resource: "r0" } }
                      }
                    }
                  }
                },
                r0: {
                  Type: "",
                  Properties: {}
                }
              }
            }
          },
          {
            name: "e1",
            template: {
              Resources: {
                middleware1: {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": { name: "middleware1-code" }
                    },
                    Environment: { Variables: { MY_VAR4: "hardcoded" } },
                    Layers: [{ "SOMOD::Ref": { resource: "l1" } }]
                  }
                },
                l1: {
                  Type: resourceType_FunctionLayer,
                  Properties: {}
                }
              }
            },
            extension: {
              middlewares: ["middleware1"]
            }
          },
          {
            name: "e2",
            template: {
              Resources: {
                middleware2: {
                  Type: resourceType_FunctionMiddleware,
                  Properties: {
                    CodeUri: {
                      "SOMOD::FunctionMiddleware": { name: "middleware1-code" }
                    },
                    Environment: { Variables: { MY_VAR5: "hardcoded" } }
                  }
                },
                l2: {
                  Type: resourceType_FunctionLayer,
                  Properties: {}
                },
                l2_2: {
                  Type: resourceType_FunctionLayer,
                  Properties: {}
                }
              }
            },
            extension: {
              layers: ["l2", "l2_2"]
            }
          }
        ]),
        "m0",
        "f0"
      );
    expect(mergedFunction).toMatchInlineSnapshot(`
      Object {
        "code": Object {
          "function": Object {
            "module": "m0",
            "name": "my-function",
          },
          "middlewares": Array [
            Object {
              "module": "m0",
              "name": "my-middleware0-code",
            },
            Object {
              "module": "e1",
              "name": "middleware1-code",
            },
          ],
        },
        "resource": Object {
          "Properties": Object {
            "CodeUri": Object {
              "SOMOD::Function": Object {
                "middlewares": Array [
                  Object {
                    "module": "m0",
                    "resource": "middleware0",
                  },
                  Object {
                    "module": "e1",
                    "resource": "middleware1",
                  },
                ],
                "name": "my-function",
              },
            },
            "Environment": Object {
              "Variables": Object {
                "MY_VAR1": Object {
                  "SOMOD::Parameter": "my.var1",
                },
                "MY_VAR2": Object {
                  "SOMOD::Parameter": "my.var2",
                },
                "MY_VAR3": Object {
                  "SOMOD::Ref": Object {
                    "module": "m0",
                    "resource": "r0",
                  },
                },
                "MY_VAR4": "hardcoded",
              },
            },
            "Layers": Array [
              Object {
                "SOMOD::Ref": Object {
                  "module": "e2",
                  "resource": "l2",
                },
              },
              Object {
                "SOMOD::Ref": Object {
                  "module": "e2",
                  "resource": "l2_2",
                },
              },
              Object {
                "SOMOD::Ref": Object {
                  "module": "e1",
                  "resource": "l1",
                },
              },
            ],
          },
          "Type": "AWS::Serverless::Function",
        },
      }
    `);
  });
});
