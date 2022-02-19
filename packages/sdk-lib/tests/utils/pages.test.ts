import { createFiles, createTempDir, deleteDir } from "../utils";

import {
  exportRootModulePage,
  getPageToModulesMap
} from "../../src/utils/pages";
import { readFile } from "fs/promises";
import { join } from "path";

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

describe("Test Util pages.exportRootModulePage", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no dir", async () => {
    await expect(exportRootModulePage(null, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for no page", async () => {
    await expect(exportRootModulePage(dir, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing dir", async () => {
    const _dir = __dirname + "/sldkfjkljflkerjl";
    await expect(exportRootModulePage(_dir, null)).rejects.toHaveProperty(
      "message",
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for not existing page", async () => {
    await expect(exportRootModulePage(dir, "a.ts")).rejects.toMatchObject({
      message: expect.stringContaining("no such file or directory, open ")
    });
  });

  test("for page no exports", async () => {
    createFiles(dir, { "ui/pages/a.ts": "" });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export {  } from "../ui/pages/a";');
  });

  test("for page with only default exports", async () => {
    createFiles(dir, { "ui/pages/a.ts": "const A = 10; export default A;" });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default } from "../ui/pages/a";');
  });

  test("for page with only named exports", async () => {
    createFiles(dir, {
      "ui/pages/a.ts": "export const A = 10; export const B = 20;"
    });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { A, B } from "../ui/pages/a";');
  });

  test("for page with default and named exports", async () => {
    createFiles(dir, {
      "ui/pages/a.ts":
        "export const A = 10; export const B = 20; export default A;"
    });
    await expect(exportRootModulePage(dir, "a.ts")).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a.ts"), { encoding: "utf8" })
    ).resolves.toEqual('export { default, A, B } from "../ui/pages/a";');
  });

  test("for deep page", async () => {
    createFiles(dir, {
      "ui/pages/a/b/c.ts":
        "export const A = 10; export const B = 20; export default A;"
    });
    await expect(
      exportRootModulePage(dir, "a/b/c.ts")
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "pages", "a/b/c.ts"), { encoding: "utf8" })
    ).resolves.toEqual(
      'export { default, A, B } from "../../../ui/pages/a/b/c";'
    );
  });
});
