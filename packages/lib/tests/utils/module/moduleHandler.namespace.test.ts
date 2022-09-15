import { createFiles, createTempDir, deleteDir } from "../../utils";
import { ModuleHandler } from "../../../src/utils/moduleHandler";

describe("Test util getNamespaces", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");

    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "root",
        version: "1.0.0",
        somod: "1.0.0",
        dependencies: {
          m1: "1.0.1",
          m2: "1.0.2"
        }
      }),
      "node_modules/m1/package.json": JSON.stringify({
        name: "m1",
        version: "1.0.1",
        somod: "1.0.0",
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
        somod: "1.0.0",
        dependencies: {
          m4: "1.4.0",
          m5: "1.5.0"
        }
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "1.3.0",
        somod: "1.0.0"
      }),
      "node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "1.4.0",
        somod: "1.0.0"
      }),
      "node_modules/m2/node_modules/m5/package.json": JSON.stringify({
        name: "m5",
        version: "1.5.0",
        somod: "1.0.0"
      })
    });
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no namespaces", async () => {
    ModuleHandler.initialize(dir, []);
    const moduleHandler = ModuleHandler.getModuleHandler();

    const namespaces = await moduleHandler.getNamespaces();

    expect(namespaces).toEqual({});
  });

  test("with empty namespaces", async () => {
    ModuleHandler.initialize(dir, [
      async () => {
        return { n: [] };
      }
    ]);
    const moduleHandler = ModuleHandler.getModuleHandler();

    const namespaces = await moduleHandler.getNamespaces();

    expect(namespaces).toEqual({ n: {} });
  });

  test("with distict namespaces", async () => {
    ModuleHandler.initialize(dir, [
      async module => {
        return { n: [module.name + "-" + module.version] };
      }
    ]);
    const moduleHandler = ModuleHandler.getModuleHandler();

    const namespaces = await moduleHandler.getNamespaces();

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
    ModuleHandler.initialize(dir, [
      async module => {
        return { n1: [module.name + "-" + module.version] };
      },
      async module => {
        return { n2: [module.name + "-" + module.version] };
      }
    ]);
    const moduleHandler = ModuleHandler.getModuleHandler();

    const namespaces = await moduleHandler.getNamespaces();

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
    const namespaceMap = {
      root: ["n1"],
      m1: ["n2"],
      m2: ["n3"],
      m3: ["n2", "n4"],
      m4: ["n2", "n5"],
      m5: []
    };

    ModuleHandler.initialize(dir, [
      async module => {
        return { n: namespaceMap[module.name] };
      }
    ]);

    const moduleHandler = ModuleHandler.getModuleHandler();

    const namespaces = await moduleHandler.getNamespaces();

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
    const namespaceMap = {
      root: ["n1", "n2"],
      m1: [],
      m2: ["n3"],
      m3: ["n4"],
      m4: ["n2", "n5"],
      m5: ["n2"]
    };

    ModuleHandler.initialize(dir, [
      async module => {
        return { n: namespaceMap[module.name] };
      }
    ]);

    const moduleHandler = ModuleHandler.getModuleHandler();

    const namespaces = await moduleHandler.getNamespaces();

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

    ModuleHandler.initialize(dir, [
      async module => {
        return { namespaceA: namespace1Map[module.name] };
      },
      async module => {
        return { namespaceB: namespace2Map[module.name] };
      }
    ]);
    const moduleHandler = ModuleHandler.getModuleHandler();

    await expect(moduleHandler.getNamespaces()).rejects.toEqual(
      new Error(`Following namespaces are unresolved
namespaceB
 - n2
   - m1
   - m5`)
    );
  });
});
