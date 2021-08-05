import { createFiles, createTempDir, deleteDir } from "../utils";

import { getPublicAssetToModulesMap } from "../../src/utils/publicAssets";

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
        njp: true,
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
        njp: true
      }),
      "node_modules/m2/node_modules/m5/package.json": JSON.stringify({
        name: "m5",
        version: "4.6.0",
        njp: true
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "2.2.0",
        njp: true
      }),
      "node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "3.6.0",
        njp: true
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
