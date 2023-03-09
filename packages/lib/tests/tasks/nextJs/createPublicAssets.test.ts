import { createFiles, createTempDir, deleteDir, readFiles } from "../../utils";
import { createPublicAssets } from "../../../src";
import { join } from "path";
import { IContext } from "somod-types";

describe("Test Task createPublicAssets", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for module with multi level dependency", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        somod: "1.3.2",
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
        somod: "1.3.2"
      }),
      "node_modules/m2/node_modules/m5/package.json": JSON.stringify({
        name: "m5",
        version: "4.6.0",
        somod: "1.3.2"
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "2.2.0",
        somod: "1.3.2"
      }),
      "node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "3.6.0",
        somod: "1.3.2"
      }),
      "node_modules/m6/package.json": JSON.stringify({
        name: "m6",
        version: "7.1.7"
      }),
      "ui/public/home.html": "ghkdfjhgkjdsfkl",
      "ui/public/about/us.html": "hrewiugtiwehuhti",
      "node_modules/m2/build/ui/public/about.html": "fewkqhkhfklhqekl",
      "node_modules/m2/build/ui/public/home.html": "roqpewyropewyopi",
      "node_modules/m2/node_modules/m5/build/ui/public/contact.js": "kuowh",
      "node_modules/m2/node_modules/m5/build/ui/public/survey.js": "iuuhiuh",
      "node_modules/m3/build/ui/public/home.html": "uiyouroi",
      "node_modules/m3/build/ui/public/about/me.html": "nlkhkwjher"
    });

    await expect(
      createPublicAssets({
        dir,
        moduleHandler: {
          getModule(module) {
            const moduleLocationMap = {
              m1: "",
              m2: "node_modules/m2",
              m3: "node_modules/m3",
              m5: "node_modules/m2/node_modules/m5"
            };
            return {
              module: {
                name: module,
                root: module == "m1",
                packageLocation: join(dir, moduleLocationMap[module])
              }
            };
          }
        } as IContext["moduleHandler"],
        namespaceHandler: {
          get() {
            return [
              { name: "UI Page", module: "m1", value: "home.html" },
              { name: "UI Page", module: "m1", value: "about/us.html" },
              { name: "UI Page", module: "m2", value: "about.html" },
              { name: "UI Page", module: "m5", value: "contact.js" },
              { name: "UI Page", module: "m5", value: "survey.js" },
              { name: "UI Page", module: "m3", value: "about/me.html" }
            ];
          },
          names: []
        } as IContext["namespaceHandler"]
      } as IContext)
    ).resolves.toBeUndefined();

    expect(readFiles(join(dir, "public"))).toEqual({
      "home.html": "ghkdfjhgkjdsfkl",
      "about/us.html": "hrewiugtiwehuhti",
      "about.html": "fewkqhkhfklhqekl",
      "contact.js": "kuowh",
      "survey.js": "iuuhiuh",
      "about/me.html": "nlkhkwjher"
    });
  });
});
