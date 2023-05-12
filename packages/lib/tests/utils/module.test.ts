import { createFiles, createTempDir, deleteDir } from "../utils";
import { Module, ModuleNode } from "somod-types";
import { join, normalize } from "path";
import { ModuleHandler } from "../../src/utils/module";

const getRootModuleNode = async (dir: string) => {
  const moduleHandler = await ModuleHandler.getInstance(dir);
  return moduleHandler.getModule(moduleHandler.rootModuleName);
};

const listModules = async (dir: string) => {
  return (await ModuleHandler.getInstance(dir)).list;
};

describe("Test util getRootModuleNode with invalid input", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });
  afterEach(() => {
    deleteDir(dir);
  });

  test("no input", async () => {
    const _dir = undefined;
    await expect(getRootModuleNode(_dir)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received undefined'
    );
  });

  test("empty string", async () => {
    await expect(getRootModuleNode("")).rejects.toEqual(
      new Error(" is not a SOMOD module")
    );
  });

  test("non existing directory", async () => {
    const nonExistingDir = join(__dirname, "hhgrgiurehkwhgruii");
    await expect(getRootModuleNode(nonExistingDir)).rejects.toHaveProperty(
      "message",
      `ENOENT: no such file or directory, open '${join(
        nonExistingDir,
        "package.json"
      )}'`
    );
  });

  test("non somod module", async () => {
    createFiles(dir, {
      "node_modules/a/package.json": '{"name":"a"}',
      "package.json": '{"name":"m1"}'
    });
    await expect(getRootModuleNode(dir)).rejects.toEqual(
      new Error(dir + " is not a SOMOD module")
    );
  });

  test("uninstalled module", async () => {
    createFiles(dir, {
      "node_modules/a/package.json": '{"name":"a"}',
      "package.json": JSON.stringify({
        name: "m1",
        somod: "1.3.0",
        dependencies: { m1: "0.0.2" }
      })
    });
    await expect(getRootModuleNode(dir)).rejects.toEqual(
      new Error(`Module m1 not found from ${normalize(dir)}`)
    );
  });

  test("with resused dependencies", async () => {
    createFiles(dir, {
      "node_modules/m2/package.json": stringify({
        name: "m2",
        version: "0.0.2",
        somod: "1.3.2",
        dependencies: {
          m3: "0.0.3",
          m4: "2.1.0"
        }
      }),
      "node_modules/m2/node_modules/m3/package.json": stringify({
        name: "m3",
        version: "0.0.3",
        somod: "1.3.2",
        dependencies: {
          m4: "0.0.4"
        }
      }),
      "node_modules/m2/node_modules/m4/package.json": stringify({
        name: "m4",
        version: "2.1.0",
        somod: "1.3.2"
      }),
      "node_modules/m4/package.json": stringify({
        name: "m4",
        version: "1.0.4",
        somod: "1.3.2"
      }),
      "package.json": stringify({
        name: "m1",
        version: "0.0.1",
        somod: "1.3.2",
        dependencies: {
          m2: "0.0.2",
          m4: "1.0.4"
        }
      })
    });
    await expect(getRootModuleNode(dir)).rejects.toEqual(
      new Error(`Following modules are repeated
m4
 - ${join(dir, "node_modules/m4")}
 - ${join(dir, "/node_modules/m2/node_modules/m4")}`)
    );
  });
});

type ModuleNodeSerialized = {
  nodes: Record<string, Module>;
  parents: Record<string, string[]>;
  children: Record<string, string[]>;
};

const serializeModuleNode = (moduleNode: ModuleNode) => {
  const serialized: ModuleNodeSerialized = {
    nodes: {},
    parents: {},
    children: {}
  };

  const queue = [moduleNode];
  while (queue.length > 0) {
    const node = queue.shift();
    const name = node.module.name;
    if (serialized.nodes[name] === undefined) {
      serialized.nodes[name] = node.module;
      serialized.parents[name] = node.parents.map(mn => mn.module.name);
      serialized.children[name] = node.children.map(mn => mn.module.name);

      node.children.forEach(mn => {
        queue.push(mn);
      });
    }
  }

  return serialized;
};

const template = (
  description: string,
  files: Record<string, string>,
  expected: ModuleNodeSerialized
): void => {
  describe(description, () => {
    let dir: string = null;
    beforeEach(() => {
      dir = createTempDir("test-somod-lib");
      createFiles(dir, files);
    });
    afterEach(() => {
      deleteDir(dir);
      ModuleHandler["instance"] = undefined;
    });
    test("test", async () => {
      const actual = await getRootModuleNode(dir);

      const actualSerialized = serializeModuleNode(actual);

      Object.values(expected.nodes).forEach(mn => {
        //@ts-expect-error this is fine
        mn.packageLocation = join(dir, mn.packageLocation);
      });

      expect(actualSerialized).toEqual(expected);
    });
  });
};

const stringify = (json: Record<string, unknown>): string => {
  return JSON.stringify(json, null, 2);
};

template(
  "Test util getRootModuleNode with no dependencies",
  {
    "package.json": stringify({ name: "m1", version: "0.0.1", somod: "1.3.0" })
  },
  {
    nodes: {
      m1: {
        name: "m1",
        version: "0.0.1",
        packageLocation: "",
        root: true
      }
    },
    parents: { m1: [] },
    children: { m1: [] }
  }
);

template(
  "Test util getRootModuleNode with non module dependency",
  {
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2"
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      somod: "1.3.0",
      dependencies: {
        m2: "0.0.2"
      }
    })
  },
  {
    nodes: {
      m1: {
        name: "m1",
        version: "0.0.1",
        packageLocation: "",
        root: true
      }
    },
    parents: { m1: [] },
    children: { m1: [] }
  }
);

template(
  "Test util getRootModuleNode with unreachable module",
  {
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2",
      dependencies: {
        m3: "0.0.3"
      }
    }),
    "node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      somod: "1.3.0"
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      somod: "1.2.9",
      dependencies: {
        m2: "0.0.2"
      }
    })
  },
  {
    nodes: {
      m1: {
        name: "m1",
        version: "0.0.1",
        packageLocation: "",
        root: true
      }
    },
    parents: { m1: [] },
    children: { m1: [] }
  }
);

template(
  "Test util getRootModuleNode with 2 level dependencies",
  {
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2",
      somod: "1.3.2",
      dependencies: {
        m3: "0.0.3"
      }
    }),
    "node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      somod: "1.3.2"
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      somod: "1.3.2",
      dependencies: {
        m2: "0.0.2"
      }
    })
  },
  {
    nodes: {
      m1: {
        name: "m1",
        version: "0.0.1",
        packageLocation: "",
        root: true
      },
      m2: {
        name: "m2",
        version: "0.0.2",
        packageLocation: "node_modules/m2",
        root: false
      },
      m3: {
        name: "m3",
        version: "0.0.3",
        packageLocation: "node_modules/m3",
        root: false
      }
    },
    parents: {
      m1: [],
      m2: ["m1"],
      m3: ["m2"]
    },
    children: {
      m1: ["m2"],
      m2: ["m3"],
      m3: []
    }
  }
);

template(
  "Test util getRootModuleNode with dev and peer dependencies",
  {
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      somod: "1.3.2",
      dependencies: {
        m5: "0.0.5"
      },
      devDependencies: {
        m2: "0.0.2",
        m3: "0.0.3"
      },
      peerDependencies: {
        m2: "0.0.2",
        m4: "0.0.4"
      }
    }),
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2",
      somod: "1.3.0",
      dependencies: {
        m8: "1.0.8"
      },
      devDependencies: {
        m7: "1.0.7"
      },
      peerDependencies: {
        m6: "1.0.6"
      }
    }),
    "node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      somod: "1.3.2"
    }),
    "node_modules/m4/package.json": stringify({
      name: "m4",
      version: "0.0.4",
      somod: "1.3.1"
    }),
    "node_modules/m5/package.json": stringify({
      name: "m5",
      version: "0.0.5",
      somod: "1.3.1"
    }),
    "node_modules/m6/package.json": stringify({
      name: "m6",
      version: "1.0.6",
      somod: "1.3.1"
    }),
    "node_modules/m7/package.json": stringify({
      name: "m7",
      version: "1.0.7",
      somod: "1.3.1"
    }),
    "node_modules/m2/node_modules/m8/package.json": stringify({
      name: "m8",
      version: "1.0.8",
      somod: "1.3.1"
    })
  },
  {
    nodes: {
      m1: {
        name: "m1",
        version: "0.0.1",
        packageLocation: "",
        root: true
      },
      m2: {
        name: "m2",
        version: "0.0.2",
        packageLocation: "node_modules/m2",
        root: false
      },
      m3: {
        name: "m3",
        version: "0.0.3",
        packageLocation: "node_modules/m3",
        root: false
      },
      m5: {
        name: "m5",
        version: "0.0.5",
        packageLocation: "node_modules/m5",
        root: false
      },
      m6: {
        name: "m6",
        version: "1.0.6",
        packageLocation: "node_modules/m6",
        root: false
      },
      m8: {
        name: "m8",
        version: "1.0.8",
        packageLocation: "node_modules/m2/node_modules/m8",
        root: false
      }
    },
    parents: {
      m1: [],
      m2: ["m1"],
      m3: ["m1"],
      m5: ["m1"],
      m6: ["m2"],
      m8: ["m2"]
    },
    children: {
      m1: ["m5", "m2", "m3"],
      m2: ["m8", "m6"],
      m3: [],
      m5: [],
      m6: [],
      m8: []
    }
  }
);

template(
  "Test util getRootModuleNode with scoped package",
  {
    "node_modules/@s/m2/package.json": stringify({
      name: "@s/m2",
      version: "0.0.2",
      somod: "1.3.2",
      dependencies: {
        m3: "0.0.3"
      }
    }),
    "node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      somod: "1.3.2"
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      somod: "1.3.2",
      dependencies: {
        "@s/m2": "0.0.2"
      }
    })
  },
  {
    nodes: {
      m1: {
        name: "m1",
        version: "0.0.1",
        packageLocation: "",
        root: true
      },
      "@s/m2": {
        name: "@s/m2",
        version: "0.0.2",
        packageLocation: "node_modules/@s/m2",
        root: false
      },
      m3: {
        name: "m3",
        version: "0.0.3",
        packageLocation: "node_modules/m3",
        root: false
      }
    },
    parents: {
      m1: [],
      "@s/m2": ["m1"],
      m3: ["@s/m2"]
    },
    children: {
      m1: ["@s/m2"],
      "@s/m2": ["m3"],
      m3: []
    }
  }
);

describe("Test util listModules", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    createFiles(dir, {
      "node_modules/m2/package.json": stringify({
        name: "m2",
        version: "0.0.2",
        somod: "1.3.0",
        dependencies: {
          m3: "0.0.3"
        }
      }),
      "node_modules/m2/node_modules/m3/package.json": stringify({
        name: "m3",
        version: "0.0.3",
        somod: "1.3.2",
        dependencies: {
          m4: "0.0.4"
        }
      }),
      "node_modules/m4/package.json": stringify({
        name: "m4",
        version: "1.0.4",
        somod: "1.3.1"
      }),
      "package.json": stringify({
        name: "m1",
        version: "0.0.1",
        somod: "1.3.2",
        dependencies: {
          m2: "0.0.2",
          m4: "1.0.4"
        }
      })
    });
  });
  afterEach(() => {
    deleteDir(dir);
  });
  test("test", async () => {
    const actual = await listModules(dir);

    expect(actual.map(mn => mn.module.name)).toEqual(["m1", "m2", "m3", "m4"]);
  });
});
