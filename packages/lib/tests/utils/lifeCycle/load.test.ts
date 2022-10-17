import { createFiles, createTempDir, deleteDir } from "../../utils";
import { loadLifeCycleHooks } from "../../../src/utils/lifeCycle/load";
import { ModuleHandler } from "../../../src/utils/moduleHandler";

describe("Test util loadLifeCycleHooks", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no modules", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: "1.0.0" }) });
    ModuleHandler.initialize(dir, []);
    const hooks = await loadLifeCycleHooks();
    expect(hooks).toEqual([]);
  });

  test("with valid lifeCycleHooks", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        somod: "1.0.0",
        version: "1.2.0",
        dependencies: {
          "somod-plugin1": "^1.0.0"
        }
      }),
      "build/lifeCycle.js": `module.exports = {
        namespaceLoader: 10 
      }`, // lifeCycle from root module is skipped
      "node_modules/somod-plugin1/package.json": JSON.stringify({
        name: "somod-plugin1",
        version: "1.2.0",
        somod: "1.0.0",
        dependencies: {
          "somod-plugin2": "^1.0.0"
        }
      }),
      "node_modules/somod-plugin1/build/lifeCycle.js": `module.exports = {
        tsconfig: { include: ["widgets"] },
        namespaceLoader: 20
      }`,
      "node_modules/somod-plugin2/package.json": JSON.stringify({
        name: "somod-plugin2",
        version: "1.2.0",
        somod: "1.0.0"
      }),
      "node_modules/somod-plugin2/build/lifeCycle.js": `module.exports = {
        tsconfig: {
          compilerOptions: 200,
          include: [300]
        },
        namespaceLoader: 400,
        prebuild: 500,
        build: 600,
        preprepare: 700,
        prepare: 800
      }`
    });

    ModuleHandler.initialize(dir, []);

    const hooks = await loadLifeCycleHooks();

    expect(hooks).toEqual([
      {
        name: "somod-plugin2",
        lifeCycle: {
          tsconfig: {
            compilerOptions: 200,
            include: [300]
          },
          namespaceLoader: 400,
          prebuild: 500,
          build: 600,
          preprepare: 700,
          prepare: 800
        }
      },
      {
        name: "somod-plugin1",
        lifeCycle: {
          tsconfig: { include: ["widgets"] },
          namespaceLoader: 20
        }
      }
    ]);
  });
});
