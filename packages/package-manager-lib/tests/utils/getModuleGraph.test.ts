import { join } from "path";
import getModuleGraph, {
  ModuleNode as NjpNode
} from "../../src/utils/getModuleGraph";
import unixStylePath from "../../src/utils/unixStylePath";
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
  expected: NjpNode
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
      const updatePackageLocation = (node: NjpNode): NjpNode => {
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
