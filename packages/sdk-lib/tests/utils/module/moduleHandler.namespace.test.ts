import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { ModuleHandler } from "../../../src/utils/moduleHandler";

describe("Test util getNamespaces", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir();

    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "root",
        version: "1.0.0",
        njp: "1.0.0",
        dependencies: {
          m1: "1.0.1",
          m2: "1.0.2"
        }
      }),
      "node_modules/m1/package.json": JSON.stringify({
        name: "m1",
        version: "1.0.1",
        njp: "1.0.0",
        dependencies: {
          m4: "1.4.0"
        },
        devDependencies: {
          m3: "1.3.0",
          p1: "1.0.0"
        },
        peerDependencies: {
          m3: "1.3.0",
          p2: "1.0.0"
        }
      }),
      "node_modules/m2/package.json": JSON.stringify({
        name: "m2",
        version: "1.0.2",
        njp: "1.0.0",
        dependencies: {
          m4: "1.4.0",
          m5: "1.5.0"
        }
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "1.3.0",
        njp: "1.0.0"
      }),
      "node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "1.4.0",
        njp: "1.0.0"
      }),
      "node_modules/m2/node_modules/m5/package.json": JSON.stringify({
        name: "m5",
        version: "1.5.0",
        njp: "1.0.0"
      })
    });
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no namespaces", async () => {
    const moduleHandler = ModuleHandler.getModuleHandler(dir, ["njp"]);

    const namespaces = await moduleHandler.getNamespaces({
      njp: async () => {
        // don't do anything
      }
    });

    expect(namespaces).toEqual({});
  });

  test("with distict namespaces", async () => {
    const moduleHandler = ModuleHandler.getModuleHandler(dir, ["njp"]);

    const namespaces = await moduleHandler.getNamespaces({
      njp: async module => {
        module.namespaces["n"] = [module.name + "-" + module.version];
      }
    });

    expect(namespaces).toEqual({
      n: {
        "root-1.0.0": "root",
        "m1-1.0.1": "m1",
        "m2-1.0.2": "m2",
        "m3-1.3.0": "m3",
        "m4-1.4.0": "m4",
        "m5-1.5.0": "m5"
      }
    });
  });

  test("with distict namespaces in multiple namespaceNames", async () => {
    const moduleHandler = ModuleHandler.getModuleHandler(dir, ["njp"]);

    const namespaces = await moduleHandler.getNamespaces({
      njp: async module => {
        module.namespaces["n1"] = [module.name + "-" + module.version];
        module.namespaces["n2"] = [module.name + "-" + module.version];
      }
    });

    expect(namespaces).toEqual({
      n1: {
        "root-1.0.0": "root",
        "m1-1.0.1": "m1",
        "m2-1.0.2": "m2",
        "m3-1.3.0": "m3",
        "m4-1.4.0": "m4",
        "m5-1.5.0": "m5"
      },
      n2: {
        "root-1.0.0": "root",
        "m1-1.0.1": "m1",
        "m2-1.0.2": "m2",
        "m3-1.3.0": "m3",
        "m4-1.4.0": "m4",
        "m5-1.5.0": "m5"
      }
    });
  });

  test("with conflicts resolved at higher modules", async () => {
    const moduleHandler = ModuleHandler.getModuleHandler(dir, ["njp"]);

    const namespaceMap = {
      root: ["n1"],
      m1: ["n2"],
      m2: ["n3"],
      m3: ["n2", "n4"],
      m4: ["n2", "n5"],
      m5: []
    };
    const namespaces = await moduleHandler.getNamespaces({
      njp: async module => {
        module.namespaces["n"] = namespaceMap[module.name];
      }
    });

    expect(namespaces).toEqual({
      n: {
        n1: "root",
        n2: "m1",
        n3: "m2",
        n4: "m3",
        n5: "m4"
      }
    });
  });

  test("with conflicts resolved at super higher modules", async () => {
    const moduleHandler = ModuleHandler.getModuleHandler(dir, ["njp"]);

    const namespaceMap = {
      root: ["n1", "n2"],
      m1: [],
      m2: ["n3"],
      m3: ["n4"],
      m4: ["n2", "n5"],
      m5: ["n2"]
    };
    const namespaces = await moduleHandler.getNamespaces({
      njp: async module => {
        module.namespaces["n"] = namespaceMap[module.name];
      }
    });

    expect(namespaces).toEqual({
      n: {
        n1: "root",
        n2: "root",
        n3: "m2",
        n4: "m3",
        n5: "m4"
      }
    });
  });

  test("with unresolved conflicts", async () => {
    const moduleHandler = ModuleHandler.getModuleHandler(dir, ["njp"]);

    const namespace1Map = {
      root: ["n1", "n2"],
      m1: [],
      m2: ["n3"],
      m3: ["n4"],
      m4: ["n2", "n5"],
      m5: ["n2"]
    };
    const namespace2Map = {
      root: ["n1"],
      m1: ["n2"],
      m2: ["n3"],
      m3: ["n4"],
      m4: ["n2", "n5"],
      m5: ["n2"]
    };

    await expect(
      moduleHandler.getNamespaces({
        njp: async module => {
          module.namespaces["namespaceA"] = namespace1Map[module.name];
          module.namespaces["namespaceB"] = namespace2Map[module.name];
        }
      })
    ).rejects.toEqual(
      new Error(`Following namespaces are unresolved
namespaceB
 - n2
   - m1
   - m5`)
    );
  });
});
