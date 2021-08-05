import { createFiles, createTempDir, deleteDir } from "../utils";

import { getPageToModulesMap } from "../../src/utils/pages";

describe("Test Util pages.getPageToModulesMap", () => {
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
      "build/ui/pages.json": JSON.stringify({
        home: {
          prefix: "Page1",
          exports: { default: true, named: [] }
        }
      }),
      "node_modules/m2/build/ui/pages.json": JSON.stringify({
        about: {
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps"] }
        },
        home: {
          prefix: "Page2",
          exports: { default: true, named: [] }
        }
      }),
      "node_modules/m2/node_modules/m5/build/ui/pages.json": JSON.stringify({
        contact: {
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps", "Contact"] }
        },
        survey: {
          prefix: "Page2",
          exports: { default: true, named: [] }
        }
      }),
      "node_modules/m3/build/ui/pages.json": JSON.stringify({
        home: {
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps", "Home"] }
        },
        "about/me": {
          prefix: "Page2",
          exports: { default: true, named: [] }
        }
      })
    });
    await expect(
      getPageToModulesMap([
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
      home: [
        {
          moduleName: "m1",
          prefix: "Page1",
          exports: { default: true, named: [] }
        },
        {
          moduleName: "m2",
          prefix: "Page2",
          exports: { default: true, named: [] }
        },
        {
          moduleName: "m3",
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps", "Home"] }
        }
      ],
      about: [
        {
          moduleName: "m2",
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps"] }
        }
      ],
      contact: [
        {
          moduleName: "m5",
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps", "Contact"] }
        }
      ],
      survey: [
        {
          moduleName: "m5",
          prefix: "Page2",
          exports: { default: true, named: [] }
        }
      ],
      "about/me": [
        {
          moduleName: "m3",
          prefix: "Page2",
          exports: { default: true, named: [] }
        }
      ]
    });
  });
});
