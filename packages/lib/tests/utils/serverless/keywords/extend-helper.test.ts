import {
  ResourcePropertySourceNode,
  ServerlessResource,
  ServerlessTemplate
} from "somod-types";
import { ExtendUtil } from "../../../../src/utils/serverless/keywords/extend-helper";

describe("Test helper for extend keyword", () => {
  const cases: [
    string,
    Record<string, ServerlessTemplate>,
    Record<
      string,
      Record<
        string,
        {
          resource: ServerlessResource;
          propertySourceMap: ResourcePropertySourceNode;
        }
      >
    >
  ][] = [
    ["empty", {}, {}],
    ["no resources", { m1: { Resources: {} } }, { m1: {} }],
    [
      "one resource",
      { m1: { Resources: { r1: { Type: "TypeR", Properties: {} } } } },
      {
        m1: {
          r1: {
            resource: { Type: "TypeR", Properties: {} },
            propertySourceMap: { module: "m1", resource: "r1", children: {} }
          }
        }
      }
    ],
    [
      "one resource with properties",
      {
        m1: {
          Resources: {
            r1: {
              Type: "TypeR",
              Properties: {
                P1: "string",
                P2: true,
                P3: ["array"],
                P4: { this: "object" }
              }
            }
          }
        }
      },
      {
        m1: {
          r1: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "string",
                P2: true,
                P3: ["array"],
                P4: { this: "object" }
              }
            },
            propertySourceMap: { module: "m1", resource: "r1", children: {} }
          }
        }
      }
    ],
    [
      "two resources",
      {
        m1: {
          Resources: {
            r1: {
              Type: "TypeR",
              Properties: {
                P1: "hello"
              }
            },
            r2: {
              Type: "TypeR",
              Properties: {
                P_1: "world"
              }
            }
          }
        }
      },
      {
        m1: {
          r1: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello"
              }
            },
            propertySourceMap: { module: "m1", resource: "r1", children: {} }
          },
          r2: {
            resource: {
              Type: "TypeR",
              Properties: {
                P_1: "world"
              }
            },
            propertySourceMap: { module: "m1", resource: "r2", children: {} }
          }
        }
      }
    ],
    [
      "1 level extended",
      {
        m1: {
          Resources: {
            r1: {
              Type: "TypeR",
              Properties: { P1: "hello" }
            }
          }
        },
        m2: {
          Resources: {
            r2: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m1", resource: "r1" },
              Properties: {
                P2: "world"
              }
            }
          }
        }
      },
      {
        m1: {
          r1: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: { P2: { module: "m2", resource: "r2", children: {} } }
            }
          }
        },
        m2: {
          r2: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: { P2: { module: "m2", resource: "r2", children: {} } }
            }
          }
        }
      }
    ],
    [
      "multilevel level extended",
      {
        m1: {
          Resources: {
            r1: {
              Type: "TypeR",
              Properties: { P1: "hello" }
            }
          }
        },
        m2: {
          Resources: {
            r2: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m1", resource: "r1" },
              Properties: {
                P2: "world"
              }
            }
          }
        },
        m3: {
          Resources: {
            r3: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m1", resource: "r1" },
              Properties: {
                P3: "Hi"
              }
            }
          }
        },
        m4: {
          Resources: {
            r4: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m2", resource: "r2" },
              Properties: {
                P4: "How are you"
              }
            }
          }
        }
      },
      {
        m1: {
          r1: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        },
        m2: {
          r2: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        },
        m3: {
          r3: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        },
        m4: {
          r4: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        }
      }
    ],
    [
      "multilevel level extended",
      {
        m1: {
          Resources: {
            r1: {
              Type: "TypeR",
              Properties: { P1: "hello" }
            }
          }
        },
        m2: {
          Resources: {
            r2: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m1", resource: "r1" },
              Properties: {
                P2: "world"
              }
            }
          }
        },
        m3: {
          Resources: {
            r3: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m1", resource: "r1" },
              Properties: {
                P3: "Hi"
              }
            }
          }
        },
        m4: {
          Resources: {
            r4: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m2", resource: "r2" },
              Properties: {
                P4: "How are you"
              }
            }
          }
        }
      },
      {
        m1: {
          r1: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        },
        m2: {
          r2: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        },
        m3: {
          r3: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        },
        m4: {
          r4: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: "world",
                P3: "Hi",
                P4: "How are you"
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: { module: "m2", resource: "r2", children: {} },
                P3: { module: "m3", resource: "r3", children: {} },
                P4: { module: "m4", resource: "r4", children: {} }
              }
            }
          }
        }
      }
    ],
    [
      "extend with rules",
      {
        m1: {
          Resources: {
            r1: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: [{ P3: ["world"] }],
                P4: { P5: "Hello", P6: "World" }
              }
            }
          }
        },
        m2: {
          Resources: {
            r2: {
              Type: "TypeR",
              "SOMOD::Extend": {
                module: "m1",
                resource: "r1",
                rules: { "$..P2": "APPEND" }
              },
              Properties: {
                P2: ["world"]
              }
            }
          }
        },
        m3: {
          Resources: {
            r3: {
              Type: "TypeR",
              "SOMOD::Extend": {
                module: "m1",
                resource: "r1",
                rules: { "$.P4": "REPLACE" }
              },
              Properties: {
                P4: { P5: "Hi" }
              }
            }
          }
        },
        m4: {
          Resources: {
            r4: {
              Type: "TypeR",
              "SOMOD::Extend": {
                module: "m2",
                resource: "r2",
                rules: { "$.P2": "PREPEND" }
              },
              Properties: {
                P2: ["How are you"]
              }
            }
          }
        }
      },
      {
        m1: {
          r1: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: ["How are you", { P3: ["world"] }, "world"],
                P4: { P5: "Hi" }
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: {
                  module: "m1",
                  resource: "r1",
                  children: {
                    0: { module: "m4", resource: "r4", children: {} },
                    2: { module: "m2", resource: "r2", children: {} }
                  }
                },
                P4: { module: "m3", resource: "r3", children: {} }
              }
            }
          }
        },
        m2: {
          r2: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: ["How are you", { P3: ["world"] }, "world"],
                P4: { P5: "Hi" }
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: {
                  module: "m1",
                  resource: "r1",
                  children: {
                    0: { module: "m4", resource: "r4", children: {} },
                    2: { module: "m2", resource: "r2", children: {} }
                  }
                },
                P4: { module: "m3", resource: "r3", children: {} }
              }
            }
          }
        },
        m3: {
          r3: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: ["How are you", { P3: ["world"] }, "world"],
                P4: { P5: "Hi" }
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: {
                  module: "m1",
                  resource: "r1",
                  children: {
                    0: { module: "m4", resource: "r4", children: {} },
                    2: { module: "m2", resource: "r2", children: {} }
                  }
                },
                P4: { module: "m3", resource: "r3", children: {} }
              }
            }
          }
        },
        m4: {
          r4: {
            resource: {
              Type: "TypeR",
              Properties: {
                P1: "hello",
                P2: ["How are you", { P3: ["world"] }, "world"],
                P4: { P5: "Hi" }
              }
            },
            propertySourceMap: {
              module: "m1",
              resource: "r1",
              children: {
                P2: {
                  module: "m1",
                  resource: "r1",
                  children: {
                    0: { module: "m4", resource: "r4", children: {} },
                    2: { module: "m2", resource: "r2", children: {} }
                  }
                },
                P4: { module: "m3", resource: "r3", children: {} }
              }
            }
          }
        }
      }
    ]
  ];

  test.each(cases)("%s", (title, templateMap, expectedResourceMap) => {
    expect(ExtendUtil.getResourceMap(templateMap)).toEqual(expectedResourceMap);
  });

  test("not found", () => {
    expect(() =>
      ExtendUtil.getResourceMap({
        m1: {
          Resources: {
            r1: {
              Type: "TypeR",
              "SOMOD::Extend": { module: "m0", resource: "r0" },
              Properties: {}
            }
          }
        }
      })
    ).toThrow(
      new Error("Extended resource {m0, r0} not found. Extended from {m1, r1}.")
    );
  });
});
