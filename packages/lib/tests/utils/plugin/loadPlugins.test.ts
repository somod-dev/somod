import { createFiles, createTempDir, deleteDir } from "../../utils";
import { join } from "path";
import { loadPlugins } from "../../../src/utils/plugin/loadPlugins";

describe("Test util loadPlugins", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no somodPlugins key", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    const plugins = await loadPlugins(dir);
    expect(plugins).toEqual([]);
  });

  test("with empty somodPlugins", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somodPlugins: [] }) });
    const plugins = await loadPlugins(dir);
    expect(plugins).toEqual([]);
  });

  test("with not existing somodPlugins", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ somodPlugins: ["somod-plugin1"] })
    });

    await expect(loadPlugins(dir)).rejects.toEqual(
      new Error(
        "Unable to find plugin 'somod-plugin1', Make sure it is installed"
      )
    );
  });

  test("with valid somodPlugins", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        somodPlugins: ["somod-plugin1", "somod-plugin2"]
      }),
      "node_modules/somod-plugin1/package.json": JSON.stringify({
        main: "dist/index.js"
      }),
      "node_modules/somod-plugin1/dist/index.js": `module.exports = {
        tsconfig: { include: ["widgets"] },
        namespaceLoader: 20
      }`,
      "node_modules/somod-plugin2/package.json": JSON.stringify({
        main: "dist/index.js"
      }),
      "node_modules/somod-plugin2/dist/index.js": `module.exports = {
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

    const plugins = await loadPlugins(dir);

    expect(plugins).toEqual([
      {
        name: "somod-plugin1",
        plugin: {
          tsconfig: { include: ["widgets"] },
          namespaceLoader: 20
        }
      },
      {
        name: "somod-plugin2",
        plugin: {
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
      }
    ]);
  });

  test("with some somodPlugins in script location", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        somodPlugins: [
          "somod-plugin1",
          "@somod-plugins-load-test/somod-plugin2"
        ]
      }),
      "node_modules/somod-plugin1/package.json": JSON.stringify({
        main: "dist/index.js"
      }),
      "node_modules/somod-plugin1/dist/index.js": `module.exports = {
        tsconfig: { include: ["widgets"] },
        namespaceLoader: 20
      }`
    });
    createFiles(join(__dirname, "../../../"), {
      "node_modules/@somod-plugins-load-test/somod-plugin2/package.json":
        JSON.stringify({
          main: "dist/index.js"
        }),
      "node_modules/@somod-plugins-load-test/somod-plugin2/dist/index.js": `module.exports = {
        tsconfig: {
          compilerOptions: 200,
          include: [300]
        },
        namespaceLoader: 400,
        prebuild: 500,
        build: 600,
        preprepare: 700,
        prepare: 800,
        ignorePatterns: {eslint: ["path1"]}
      }`
    });

    const plugins = await loadPlugins(dir);

    expect(plugins).toEqual([
      {
        name: "somod-plugin1",
        plugin: {
          tsconfig: { include: ["widgets"] },
          namespaceLoader: 20
        }
      },
      {
        name: "@somod-plugins-load-test/somod-plugin2",
        plugin: {
          tsconfig: {
            compilerOptions: 200,
            include: [300]
          },
          namespaceLoader: 400,
          prebuild: 500,
          build: 600,
          preprepare: 700,
          prepare: 800,
          ignorePatterns: { eslint: ["path1"] }
        }
      }
    ]);
  });
});
