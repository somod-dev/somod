import { createFiles, createTempDir, deleteDir } from "../../utils";
import {
  getPublicAssetToModulesMap,
  exportRootModulePublicAsset
} from "../../../src/utils/nextJs/publicAssets";
import { readFile } from "fs/promises";
import { join } from "path";

describe("Test Util publicAssets.getPublicAssetToModulesMap", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for module with multi level dependency", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        njp: "1.3.2",
        dependencies: {
          m2: "^1.0.1",
          m3: "^2.1.0",
          m4: "^3.4.1"
        }
      }),
      "node_modules/m2/package.json": JSON.stringify({
        name: "m2",
        version: "1.0.10",
        dependencies: {
          m4: "^3.5.2",
          m5: "^4.6.0",
          m6: "^7.1.0"
        },
        njp: "1.3.2"
      }),
      "node_modules/m2/node_modules/m5/package.json": JSON.stringify({
        name: "m5",
        version: "4.6.0",
        njp: "1.3.2"
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "2.2.0",
        njp: "1.3.2"
      }),
      "node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "3.6.0",
        njp: "1.3.2"
      }),
      "node_modules/m6/package.json": JSON.stringify({
        name: "m6",
        version: "7.1.7"
      }),
      "build/ui/public/home.html": "ghkdfjhgkjdsfkl",
      "node_modules/m2/build/ui/public/about.html": "fewkqhkhfklhqekl",
      "node_modules/m2/build/ui/public/home.html": "roqpewyropewyopi",
      "node_modules/m2/node_modules/m5/build/ui/public/contact.js": "kuowh",
      "node_modules/m2/node_modules/m5/build/ui/public/survey.js": "iuuhiuh",
      "node_modules/m3/build/ui/public/home.html": "uiyouroi",
      "node_modules/m3/build/ui/public/about/me.html": "nlkhkwjher"
    });
    await expect(
      getPublicAssetToModulesMap([
        {
          name: "m1",
          version: "1.0.0",
          dependencies: ["m2", "m3", "m4", "m5"],
          packageLocation: dir
        },
        {
          name: "m2",
          version: "1.0.10",
          dependencies: ["m4", "m5"],
          packageLocation: dir + "/node_modules/m2"
        },
        {
          name: "m4",
          version: "3.6.0",
          dependencies: [],
          packageLocation: dir + "/node_modules/m4"
        },
        {
          name: "m5",
          version: "4.6.0",
          dependencies: [],
          packageLocation: dir + "/node_modules/m2/node_modules/m5"
        },
        {
          name: "m3",
          version: "2.2.0",
          dependencies: [],
          packageLocation: dir + "/node_modules/m3"
        }
      ])
    ).resolves.toEqual({
      "home.html": [
        {
          moduleName: "m1",
          packageLocation: dir
        },
        {
          moduleName: "m2",
          packageLocation: dir + "/node_modules/m2"
        },
        {
          moduleName: "m3",
          packageLocation: dir + "/node_modules/m3"
        }
      ],
      "about.html": [
        {
          moduleName: "m2",
          packageLocation: dir + "/node_modules/m2"
        }
      ],
      "contact.js": [
        {
          moduleName: "m5",
          packageLocation: dir + "/node_modules/m2/node_modules/m5"
        }
      ],
      "survey.js": [
        {
          moduleName: "m5",
          packageLocation: dir + "/node_modules/m2/node_modules/m5"
        }
      ],
      "about/me.html": [
        {
          moduleName: "m3",
          packageLocation: dir + "/node_modules/m3"
        }
      ]
    });
  });
});

describe("Test Util publicAssets.exportRootModulePublicAsset", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no dir", async () => {
    await expect(
      exportRootModulePublicAsset(null, null)
    ).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for no publicAsset", async () => {
    await expect(exportRootModulePublicAsset(dir, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing dir", async () => {
    const _dir = __dirname + "/sldkfjkljflkerjl";
    await expect(
      exportRootModulePublicAsset(_dir, null)
    ).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing publicAsset", async () => {
    await expect(
      exportRootModulePublicAsset(dir, "a.html")
    ).rejects.toMatchObject({
      message: expect.stringContaining("no such file or directory, copyfile ")
    });
  });

  test("for valid asset", async () => {
    createFiles(dir, { "ui/public/a.html": "dfhdsjfhkjadshklfshd" });
    await expect(
      exportRootModulePublicAsset(dir, "a.html")
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "public", "a.html"), { encoding: "utf8" })
    ).resolves.toEqual("dfhdsjfhkjadshklfshd");
  });

  test("for deep asset", async () => {
    createFiles(dir, { "ui/public/a/b/c.html": "iurroqieworhqo" });
    await expect(
      exportRootModulePublicAsset(dir, "a/b/c.html")
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "public", "a/b/c.html"), { encoding: "utf8" })
    ).resolves.toEqual("iurroqieworhqo");
  });
});
