import { join } from "path";
import {
  getDuplicateModules,
  getModuleGraph,
  ModuleNode,
  resolve,
  toList
} from "../../src/utils/module";
import { unixStylePath } from "@sodaru-cli/base";
import { createFiles, createTempDir, deleteDir } from "../utils";

describe("Test util getModuleGraph with invalid input", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir();
  });
  afterEach(() => {
    deleteDir(dir);
  });

  test("no input", async () => {
    const _dir = undefined;
    await expect(getModuleGraph(_dir, ["njp"])).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received undefined'
    );
  });

  test("empty string", async () => {
    await expect(getModuleGraph("", ["njp"])).rejects.toEqual(
      new Error(" is not njp module")
    );
  });

  test("non existing directory", async () => {
    const nonExistingDir = join(__dirname, "hhgrgiurehkwhgruii");
    await expect(
      getModuleGraph(nonExistingDir, ["njp"])
    ).rejects.toHaveProperty(
      "message",
      `ENOENT: no such file or directory, open '${join(
        nonExistingDir,
        "package.json"
      )}'`
    );
  });

  test("non njp module", async () => {
    createFiles(dir, {
      "node_modules/a/package.json": '{"name":"a"}',
      "package.json": '{"name":"m1"}'
    });
    await expect(getModuleGraph(dir, ["njp"])).rejects.toEqual(
      new Error(`${dir} is not njp module`)
    );
  });

  test("uninstalled module", async () => {
    createFiles(dir, {
      "node_modules/a/package.json": '{"name":"a"}',
      "package.json":
        '{"name":"m1", "njp": true, "dependencies":{"m1":"0.0.2"}}'
    });
    await expect(getModuleGraph(dir, ["njp"])).rejects.toEqual(
      new Error(`Could not found module m1 from ${dir}`)
    );
    deleteDir(dir);
  });
});

const template = (
  description: string,
  files: Record<string, string>,
  indicators: string[],
  expected: ModuleNode
): void => {
  describe(description, () => {
    let dir: string = null;
    beforeEach(() => {
      dir = createTempDir();
      createFiles(dir, files);
    });
    afterEach(() => {
      deleteDir(dir);
    });
    test("test", async () => {
      expect.assertions(1);
      const updatePackageLocation = (node: ModuleNode): ModuleNode => {
        node.packageLocation = unixStylePath(join(dir, node.packageLocation));
        node.dependencies.forEach(updatePackageLocation);
        return node;
      };
      await expect(getModuleGraph(dir, indicators)).resolves.toEqual(
        updatePackageLocation(expected)
      );
    });
  });
};

const stringify = (json: Record<string, unknown>): string => {
  return JSON.stringify(json, null, 2);
};

template(
  "Test util getModuleGraph with no dependencies",
  {
    "package.json": stringify({ name: "m1", version: "0.0.1", njp: true })
  },
  ["njp"],
  {
    name: "m1",
    version: "0.0.1",
    packageLocation: "",
    dependencies: []
  }
);

template(
  "Test util getModuleGraph with non module dependency",
  {
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2"
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      njp: true,
      dependencies: {
        m2: "0.0.2"
      }
    })
  },
  ["njp"],
  {
    name: "m1",
    version: "0.0.1",
    packageLocation: "",
    dependencies: []
  }
);

template(
  "Test util getModuleGraph with unreachable module",
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
      njp: true
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      njp: true,
      dependencies: {
        m2: "0.0.2"
      }
    })
  },
  ["njp"],
  {
    name: "m1",
    version: "0.0.1",
    packageLocation: "",
    dependencies: []
  }
);

template(
  "Test util getModuleGraph with 2 level dependencies",
  {
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2",
      njp: true,
      dependencies: {
        m3: "0.0.3"
      }
    }),
    "node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      njp: true
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      njp: true,
      dependencies: {
        m2: "0.0.2"
      }
    })
  },
  ["njp"],
  {
    name: "m1",
    version: "0.0.1",
    packageLocation: "",
    dependencies: [
      {
        name: "m2",
        version: "0.0.2",
        packageLocation: "node_modules/m2",
        dependencies: [
          {
            name: "m3",
            version: "0.0.3",
            packageLocation: "node_modules/m3",
            dependencies: []
          }
        ]
      }
    ]
  }
);

template(
  "Test util getModuleGraph with reused dependencies",
  {
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2",
      njp: true,
      dependencies: {
        m3: "0.0.3"
      }
    }),
    "node_modules/m2/node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      njp: true,
      dependencies: {
        m4: "0.0.4"
      }
    }),
    "node_modules/m4/package.json": stringify({
      name: "m4",
      version: "1.0.4",
      njp: true
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      njp: true,
      dependencies: {
        m2: "0.0.2",
        m4: "1.0.4"
      }
    })
  },
  ["njp"],
  {
    name: "m1",
    version: "0.0.1",
    packageLocation: "",
    dependencies: [
      {
        name: "m2",
        version: "0.0.2",
        packageLocation: "node_modules/m2",
        dependencies: [
          {
            name: "m3",
            version: "0.0.3",
            packageLocation: "node_modules/m2/node_modules/m3",
            dependencies: [
              {
                name: "m4",
                version: "1.0.4",
                packageLocation: "node_modules/m4",
                dependencies: []
              }
            ]
          }
        ]
      },
      {
        name: "m4",
        version: "1.0.4",
        packageLocation: "node_modules/m4",
        dependencies: []
      }
    ]
  }
);

template(
  "Test util getModuleGraph with multiple indicators",
  {
    "node_modules/m2/package.json": stringify({
      name: "m2",
      version: "0.0.2",
      slp: true,
      dependencies: {
        m3: "0.0.3"
      }
    }),
    "node_modules/m2/node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      njp: true,
      dependencies: {
        m4: "0.0.4"
      }
    }),
    "node_modules/m4/package.json": stringify({
      name: "m4",
      version: "1.0.4",
      emp: true
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      njp: true,
      dependencies: {
        m2: "0.0.2",
        m4: "1.0.4"
      }
    })
  },
  ["njp", "slp", "emp"],
  {
    name: "m1",
    version: "0.0.1",
    packageLocation: "",
    dependencies: [
      {
        name: "m2",
        version: "0.0.2",
        packageLocation: "node_modules/m2",
        dependencies: [
          {
            name: "m3",
            version: "0.0.3",
            packageLocation: "node_modules/m2/node_modules/m3",
            dependencies: [
              {
                name: "m4",
                version: "1.0.4",
                packageLocation: "node_modules/m4",
                dependencies: []
              }
            ]
          }
        ]
      },
      {
        name: "m4",
        version: "1.0.4",
        packageLocation: "node_modules/m4",
        dependencies: []
      }
    ]
  }
);

template(
  "Test util getModuleGraph with scoped package",
  {
    "node_modules/@s/m2/package.json": stringify({
      name: "@s/m2",
      version: "0.0.2",
      njp: true,
      dependencies: {
        m3: "0.0.3"
      }
    }),
    "node_modules/m3/package.json": stringify({
      name: "m3",
      version: "0.0.3",
      njp: true
    }),
    "package.json": stringify({
      name: "m1",
      version: "0.0.1",
      njp: true,
      dependencies: {
        "@s/m2": "0.0.2"
      }
    })
  },
  ["njp"],
  {
    name: "m1",
    version: "0.0.1",
    packageLocation: "",
    dependencies: [
      {
        name: "@s/m2",
        version: "0.0.2",
        packageLocation: "node_modules/@s/m2",
        dependencies: [
          {
            name: "m3",
            version: "0.0.3",
            packageLocation: "node_modules/m3",
            dependencies: []
          }
        ]
      }
    ]
  }
);

describe("Test util module.toList", () => {
  test("for no dependecy", () => {
    expect(
      toList({
        name: "m1",
        version: "1.0.0",
        dependencies: [],
        packageLocation: "some/location"
      })
    ).toEqual([
      {
        name: "m1",
        version: "1.0.0",
        dependencies: [],
        packageLocation: "some/location",
        path: []
      }
    ]);
  });

  test("for multiple dependecy", () => {
    const m0 = {
      name: "m0",
      version: "0.0.1",
      dependencies: [],
      packageLocation: "some/location"
    };

    const m1 = {
      name: "m1",
      version: "1.0.1",
      dependencies: [],
      packageLocation: "some/location"
    };

    const m2 = {
      name: "m2",
      version: "1.0.2",
      dependencies: [m0],
      packageLocation: "some/location"
    };

    const m = {
      name: "m",
      version: "1.0.0",
      dependencies: [m0, m1, m2],
      packageLocation: "some/location"
    };

    expect(toList(m)).toEqual([
      { ...m, path: [] },
      { ...m0, path: ["m"] },
      { ...m1, path: ["m"] },
      { ...m2, path: ["m"] },
      { ...m0, path: ["m", "m2"] }
    ]);
  });
});

describe("Test util module.getDuplicateModules", () => {
  test("for empty", () => {
    expect(getDuplicateModules([])).toEqual([]);
  });

  test("for one module", () => {
    expect(
      getDuplicateModules([
        {
          name: "m1",
          version: "1.0.0",
          dependencies: [],
          packageLocation: "some/location",
          path: []
        }
      ])
    ).toEqual([]);
  });

  test("for multiple modules with no duplicates", () => {
    const m0 = {
      name: "m0",
      version: "0.0.1",
      dependencies: [],
      packageLocation: "some/location"
    };

    const m1 = {
      name: "m1",
      version: "1.0.1",
      dependencies: [],
      packageLocation: "some/location"
    };

    const m2 = {
      name: "m2",
      version: "1.0.2",
      dependencies: [m0],
      packageLocation: "some/location"
    };

    const m = {
      name: "m",
      version: "1.0.0",
      dependencies: [m0, m1, m2],
      packageLocation: "some/location"
    };

    expect(
      getDuplicateModules([
        { ...m, path: [] },
        { ...m0, path: ["m"] },
        { ...m1, path: ["m"] },
        { ...m2, path: ["m"] },
        { ...m0, path: ["m", "m2"] }
      ])
    ).toEqual([]);
  });

  test("for multiple modules with duplicates", () => {
    const m0 = {
      name: "m0",
      version: "0.0.1",
      dependencies: [],
      packageLocation: "some/location"
    };

    const m00 = {
      name: "m0",
      version: "1.0.1",
      dependencies: [],
      packageLocation: "some/location"
    };

    const m1 = {
      name: "m1",
      version: "1.0.1",
      dependencies: [],
      packageLocation: "some/location"
    };

    const m2 = {
      name: "m2",
      version: "1.0.2",
      dependencies: [m00],
      packageLocation: "some/location"
    };

    const m = {
      name: "m",
      version: "1.0.0",
      dependencies: [m0, m1, m2],
      packageLocation: "some/location"
    };

    expect(
      getDuplicateModules([
        { ...m, path: [] },
        { ...m0, path: ["m"] },
        { ...m1, path: ["m"] },
        { ...m2, path: ["m"] },
        { ...m00, path: ["m", "m2"] }
      ])
    ).toEqual([
      {
        name: "m0",
        modules: [
          { ...m0, path: ["m"] },
          { ...m00, path: ["m", "m2"] }
        ]
      }
    ]);
  });
});

describe("Test util module.resolve", () => {
  test("for empty", () => {
    expect(resolve([], { m1: ["m2", "m3"] })).toBeUndefined();
  });

  test("for single modulename", () => {
    expect(resolve(["m1"], { m1: ["m2", "m3"] })).toEqual("m1");
  });

  test("for new single modulename", () => {
    expect(resolve(["m4"], { m1: ["m2", "m3"] })).toEqual("m4");
  });

  test("for more than 1 modulename without dependecies", () => {
    expect(() => resolve(["m4", "m1"], { m1: ["m2", "m3"] })).toThrowError(
      "module m4 not found in dependency map"
    );
  });

  test("for more than 1 which can not be resolved", () => {
    expect(() =>
      resolve(["m4", "m1"], { m1: ["m2", "m3"], m4: ["m2"] })
    ).toThrowError("Can not resolve");
  });

  test("for more than 1 which can be resolved", () => {
    expect(
      resolve(["m4", "m1"], {
        m4: ["m1", "m2", "m3"],
        m3: ["m1"],
        m2: [],
        m1: []
      })
    ).toEqual("m4");
  });
});
