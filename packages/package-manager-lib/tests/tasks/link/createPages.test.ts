import { createFiles, createTempDir, deleteDir, readFiles } from "../../utils";

import { createPages } from "../../../src";
import { join } from "path";
import { existsSync } from "fs";
import { ErrorSet } from "@sodaru-cli/base";

describe("Test Task createPages", () => {
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
          exports: { default: false, named: ["Me"] }
        }
      })
    });

    await expect(createPages(dir, ["njp"], true)).resolves.toBeUndefined();

    expect(existsSync(join(dir, "pages"))).toBeFalsy();

    await expect(createPages(dir, ["njp"])).resolves.toBeUndefined();

    expect(readFiles(join(dir, "pages"))).toEqual({
      "about.ts":
        'export { Page1 as default, Page1getInitialProps as getInitialProps } from "m2";',
      "contact.ts":
        'export { Page1 as default, Page1getInitialProps as getInitialProps, Page1Contact as Contact } from "m5";',
      "survey.ts": 'export { Page2 as default } from "m5";',
      "about/me.ts": 'export { Page2Me as Me } from "m3";'
    });
  });

  test("for unresolved pages", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        njp: true,
        dependencies: {
          m2: "^1.0.1",
          m3: "^2.1.0"
        }
      }),
      "node_modules/m2/package.json": JSON.stringify({
        name: "m2",
        version: "1.0.10",
        njp: true
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "2.2.0",
        njp: true
      }),
      "build/ui/pages.json": JSON.stringify({
        about: {
          prefix: "Page1",
          exports: { default: true, named: [] }
        }
      }),
      "node_modules/m2/build/ui/pages.json": JSON.stringify({
        about: {
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps"] }
        },
        contact: {
          prefix: "Page2",
          exports: { default: true, named: ["getInitialProps", "Contact"] }
        },
        survey: {
          prefix: "Page3",
          exports: { default: true, named: [] }
        }
      }),
      "node_modules/m3/build/ui/pages.json": JSON.stringify({
        about: {
          prefix: "Page1",
          exports: { default: true, named: ["getInitialProps"] }
        },
        contact: {
          prefix: "Page2",
          exports: { default: true, named: ["getInitialProps", "Contact"] }
        },
        "about/me": {
          prefix: "Page3",
          exports: { default: true, named: [] }
        }
      })
    });
    await expect(createPages(dir, ["njp"])).rejects.toEqual(
      new ErrorSet([
        new Error(
          "Error while resolving (m2, m3) modules for the page 'contact': Can not resolve"
        )
      ])
    );
  });
});
