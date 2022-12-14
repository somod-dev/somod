import { createFiles, createTempDir, deleteDir, readFiles } from "../../utils";
import { createPublicAssets } from "../../../src";
import { join } from "path";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { loadPublicAssetNamespaces } from "../../../src/utils/nextJs/publicAssets";
import ErrorSet from "../../../src/utils/ErrorSet";

describe("Test Task createPublicAssets", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
    ModuleHandler.initialize(dir, [loadPublicAssetNamespaces]);
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

    await expect(createPublicAssets(dir)).resolves.toBeUndefined();

    expect(readFiles(join(dir, "public"))).toEqual({
      "home.html": "ghkdfjhgkjdsfkl",
      "about/us.html": "hrewiugtiwehuhti",
      "about.html": "fewkqhkhfklhqekl",
      "contact.js": "kuowh",
      "survey.js": "iuuhiuh",
      "about/me.html": "nlkhkwjher"
    });
  });

  test("for unresolved public assets", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        somod: "1.3.2",
        dependencies: {
          m2: "^1.0.1",
          m3: "^2.1.0"
        }
      }),
      "node_modules/m2/package.json": JSON.stringify({
        name: "m2",
        version: "1.0.10",
        somod: "1.3.2"
      }),
      "node_modules/m3/package.json": JSON.stringify({
        name: "m3",
        version: "2.2.0",
        somod: "1.3.2"
      }),
      "ui/public/about.html": "ghkdfjhgkjdsfkl",
      "node_modules/m2/build/ui/public/about.html": "fewkqhkhfklhqekl",
      "node_modules/m2/build/ui/public/contact.js": "kuowh",
      "node_modules/m2/build/ui/public/survey.js": "iuuhiuh",
      "node_modules/m3/build/ui/public/about.html": "huoijoit",
      "node_modules/m3/build/ui/public/contact.js": "iphodjhor",
      "node_modules/m3/build/ui/public/about/me.html": "nlkhkwjher"
    });
    await expect(createPublicAssets(dir)).rejects.toEqual(
      new ErrorSet([
        new Error(
          `Following namespaces are unresolved
UI Public Asset
 - contact.js
   - m2
   - m3`
        )
      ])
    );
  });
});
