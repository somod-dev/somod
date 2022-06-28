import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import {
  Config,
  loadConfig,
  loadConfigNamespaces,
  buildConfig,
  generateCombinedConfig
} from "../../../src/utils/nextJs/config";

describe("Test Util nextjs.loadConfig", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no file", async () => {
    await expect(
      loadConfig({
        name: "my-module",
        type: "somod",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir
      })
    ).resolves.toEqual({});
  });

  test("for no file in root module", async () => {
    await expect(
      loadConfig({
        name: "my-module",
        type: "somod",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir,
        root: true
      })
    ).resolves.toEqual({});
  });

  test("for empty config in build", async () => {
    const config: Config = {};
    createFiles(dir, {
      "build/ui/config.json": JSON.stringify(config)
    });
    await expect(
      loadConfig({
        name: "my-module",
        type: "somod",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir
      })
    ).resolves.toEqual(config);
  });

  test("for some config in build", async () => {
    const config: Config = {
      imageDomains: ["sodaru.com", { "NJP::Parameter": "my.customdomain" }]
    };
    createFiles(dir, {
      "build/ui/config.json": JSON.stringify(config)
    });
    await expect(
      loadConfig({
        name: "my-module",
        type: "somod",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir
      })
    ).resolves.toEqual(config);
  });

  test("for config in root", async () => {
    const config: Config = {
      imageDomains: ["sodaru.com", { "NJP::Parameter": "my.customdomain" }]
    };
    createFiles(dir, {
      "ui/config.yaml": dump(config)
    });
    await expect(
      loadConfig({
        name: "my-module",
        type: "somod",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir,
        root: true
      })
    ).resolves.toEqual(config);
  });

  test("for full config", async () => {
    const config: Config = {
      env: { ENV_1: { "NJP::Parameter": "my.env1" } },
      imageDomains: ["sodaru.com", { "NJP::Parameter": "my.customdomain" }],
      publicRuntimeConfig: { theme: { "NJP::Parameter": "my.theme" } },
      serverRuntimeConfig: { siteKey: { "NJP::Parameter": "my.siteKey" } }
    };
    createFiles(dir, {
      "build/ui/config.json": JSON.stringify(config)
    });
    await expect(
      loadConfig({
        name: "my-module",
        type: "somod",
        version: "1.0.0",
        namespaces: {},
        packageLocation: dir
      })
    ).resolves.toEqual(config);
  });
});

describe("Test Util nextjs.loadConfigNamespaces", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no file", async () => {
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir
    };
    await expect(loadConfigNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({
      ...module,
      namespaces: {
        "UI Env Config": [],
        "UI Public Runtime Config": [],
        "UI Server Runtime Config": []
      }
    });
  });

  test("for no file in root module", async () => {
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir,
      root: true
    };
    await expect(loadConfigNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({
      ...module,
      namespaces: {
        "UI Env Config": [],
        "UI Public Runtime Config": [],
        "UI Server Runtime Config": []
      }
    });
  });

  test("for empty config in build", async () => {
    createFiles(dir, {
      "build/ui/config.json": JSON.stringify({ env: {} })
    });
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir
    };
    await expect(loadConfigNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({
      ...module,
      namespaces: {
        "UI Env Config": [],
        "UI Public Runtime Config": [],
        "UI Server Runtime Config": []
      }
    });
  });

  test("for config in build", async () => {
    const config: Config = {
      env: { ENV_1: { "NJP::Parameter": "my.env1" } },
      imageDomains: ["sodaru.com", { "NJP::Parameter": "my.customdomain" }],
      publicRuntimeConfig: { theme: { "NJP::Parameter": "my.theme" } },
      serverRuntimeConfig: { siteKey: { "NJP::Parameter": "my.siteKey" } }
    };
    createFiles(dir, {
      "build/ui/config.json": JSON.stringify(config)
    });
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir
    };
    await expect(loadConfigNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({
      ...module,
      namespaces: {
        "UI Env Config": Object.keys(config.env),
        "UI Public Runtime Config": Object.keys(config.publicRuntimeConfig),
        "UI Server Runtime Config": Object.keys(config.serverRuntimeConfig)
      }
    });
  });

  test("for config in root", async () => {
    const config: Config = {
      env: { ENV_1: { "NJP::Parameter": "my.env1" } },
      imageDomains: ["sodaru.com", { "NJP::Parameter": "my.customdomain" }],
      publicRuntimeConfig: { theme: { "NJP::Parameter": "my.theme" } },
      serverRuntimeConfig: { siteKey: { "NJP::Parameter": "my.siteKey" } }
    };
    createFiles(dir, {
      "ui/config.yaml": dump(config)
    });
    const module = {
      name: "my-module",
      type: "somod",
      version: "1.0.0",
      namespaces: {},
      packageLocation: dir,
      root: true
    };
    await expect(loadConfigNamespaces(module)).resolves.toBeUndefined();
    expect(module).toEqual({
      ...module,
      namespaces: {
        "UI Env Config": Object.keys(config.env),
        "UI Public Runtime Config": Object.keys(config.publicRuntimeConfig),
        "UI Server Runtime Config": Object.keys(config.serverRuntimeConfig)
      }
    });
  });
});

describe("Test Util nextJs.buildConfig", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      })
    });
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no ui/config.yaml", async () => {
    await expect(buildConfig(dir, ["somod"])).rejects.toMatchObject({
      message: `ENOENT: no such file or directory, open '${join(
        dir,
        "ui/config.yaml"
      )}'`
    });
  });

  test("for empty ui/config.yaml", async () => {
    createFiles(dir, { "ui/config.yaml": "" });
    await expect(buildConfig(dir, ["somod"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/ui/config.json"), { encoding: "utf8" })
    ).resolves.toEqual("{}");
  });

  test("for empty object in ui/config.yaml", async () => {
    createFiles(dir, { "ui/config.yaml": dump({}) });
    await expect(buildConfig(dir, ["somod"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/ui/config.json"), { encoding: "utf8" })
    ).resolves.toEqual("{}");
  });

  test("for no config in ui/config.yaml", async () => {
    createFiles(dir, { "ui/config.yaml": dump({ env: {} } as Config) });
    await expect(buildConfig(dir, ["somod"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/ui/config.json"), { encoding: "utf8" })
    ).resolves.toEqual('{"env":{}}');
  });

  test("for one config in ui/config.yaml", async () => {
    const config: Config = {
      env: { MY_ENV1: { "NJP::Parameter": "my.param1" } }
    };
    createFiles(dir, {
      "ui/config.yaml": dump(config),
      "parameters.yaml": dump({
        Parameters: { "my.param1": { type: "text", default: "1" } }
      })
    });
    await expect(buildConfig(dir, ["somod"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/ui/config.json"), { encoding: "utf8" })
    ).resolves.toEqual(JSON.stringify(config));
  });

  test("for invalid parameter in ui/config.yaml", async () => {
    const config: Config = {
      env: { MY_ENV1: { "NJP::Parameter": "my.param1" } }
    };
    createFiles(dir, {
      "ui/config.yaml": dump(config)
    });
    await expect(buildConfig(dir, ["somod"])).rejects.toEqual(
      new Error(
        `Following parameters referenced from 'ui/config.yaml' are not found\n - my.param1`
      )
    );
    expect(existsSync(join(dir, "build/ui/config.json"))).not.toBeTruthy();
  });
});

describe("test util nextJs.generateCombinedConfig", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for multiple modules", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        somod: "1.0.0",
        dependencies: {
          m2: "^1.0.0",
          m3: "^1.0.0"
        }
      }),
      "ui/config.yaml": dump({
        env: {
          MY_ENV1: { "NJP::Parameter": "m1.p1" }
        },
        imageDomains: [{ "NJP::Parameter": "m1.p2" }],
        publicRuntimeConfig: {
          myPRC2: {
            "NJP::Parameter": "m1.p3"
          }
        }
      }),
      "node_modules/m2/package.json": JSON.stringify({
        name: "m2",
        version: "1.0.0",
        somod: "1.0.0",
        dependencies: {}
      }),
      "node_modules/m2/build/ui/config.json": JSON.stringify({
        env: {
          MY_ENV1: { "NJP::Parameter": "m2.p1" },
          MY_ENV3: { "NJP::Parameter": "m2.p2" }
        },
        imageDomains: ["sodaru.com"],
        publicRuntimeConfig: {
          myPRC2: {
            "NJP::Parameter": "m2.p3"
          }
        }
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "1.0.0",
        somod: "1.0.0",
        dependencies: {
          m4: "^1.0.0"
        }
      }),
      "node_modules/m3/build/ui/config.json": JSON.stringify({
        imageDomains: ["sodaru.com"],
        publicRuntimeConfig: {
          myPRC2: {
            "NJP::Parameter": "m3.p1"
          }
        }
      }),
      "node_modules/m3/node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "1.0.0",
        somod: "1.0.0",
        dependencies: {}
      }),
      "node_modules/m3/node_modules/m4/build/ui/config.json": JSON.stringify({
        env: {
          MY_ENV1: { "NJP::Parameter": "m4.p1" },
          MY_ENV2: { "NJP::Parameter": "m4.p2" }
        },
        imageDomains: ["somod.sodaru.com", "sodaru.com"],
        publicRuntimeConfig: {
          myPRC1: {
            "NJP::Parameter": "m4.p3"
          }
        },
        serverRuntimeConfig: {
          mySRC1: {
            "NJP::Parameter": "m4.p4"
          },
          mySRC2: {
            "NJP::Parameter": "m4.p5"
          }
        }
      })
    });

    const result = await generateCombinedConfig(dir, ["somod"]);
    expect(result).toEqual({
      env: {
        MY_ENV1: { "NJP::Parameter": "m1.p1" },
        MY_ENV2: { "NJP::Parameter": "m4.p2" },
        MY_ENV3: { "NJP::Parameter": "m2.p2" }
      },
      imageDomains: [
        { "NJP::Parameter": "m1.p2" },
        "sodaru.com",
        "somod.sodaru.com"
      ],
      publicRuntimeConfig: {
        myPRC1: {
          "NJP::Parameter": "m4.p3"
        },
        myPRC2: {
          "NJP::Parameter": "m1.p3"
        }
      },
      serverRuntimeConfig: {
        mySRC1: {
          "NJP::Parameter": "m4.p4"
        },
        mySRC2: {
          "NJP::Parameter": "m4.p5"
        }
      }
    });
  });
});
