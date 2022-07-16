import { createFiles, createTempDir, deleteDir, readFiles } from "../../utils";

import { createPages } from "../../../src";
import { join } from "path";
import { ErrorSet } from "@solib/cli-base";

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
      "ui/pages/home.tsx": "export default function Homepage () {return 'a';}",
      "ui/pages/about/us.tsx":
        "export default function AboutUs () {return 'a';} export const Us='Sodaru';",
      "node_modules/m2/build/ui/pages/about.js":
        "export default function Aboutpage () {return 'a';} export const getInitialProps = () => {};",
      "node_modules/m2/build/ui/pages/home.js":
        "export default function Homepage () {return 'a';}",
      "node_modules/m2/node_modules/m5/build/ui/pages/contact.js":
        "export default function Contactpage () {return 'a';} export const getInitialProps = () => {}; export const Contact = 10;",
      "node_modules/m2/node_modules/m5/build/ui/pages/survey.js":
        "export default function Surveypage () {return 'a';}",
      "node_modules/m3/build/ui/pages/home.js":
        "export default function Homepage () {return 'a';} export const getInitialProps = () => {}; export const Home = 10;",
      "node_modules/m3/build/ui/pages/about/me.js":
        "export default function AboutMepage () {return 'a';} export const Me = () => {};"
    });

    await expect(createPages(dir, ["somod"])).resolves.toBeUndefined();

    expect(readFiles(join(dir, "pages"))).toEqual({
      "home.ts": 'export { default } from "../ui/pages/home";',
      "about/us.ts": 'export { default, Us } from "../../ui/pages/about/us";',
      "about.ts":
        'export { default, getInitialProps } from "../node_modules/m2/build/ui/pages/about";',
      "contact.ts":
        'export { default, getInitialProps, Contact } from "../node_modules/m2/node_modules/m5/build/ui/pages/contact";',
      "survey.ts":
        'export { default } from "../node_modules/m2/node_modules/m5/build/ui/pages/survey";',
      "about/me.ts":
        'export { default, Me } from "../../node_modules/m3/build/ui/pages/about/me";'
    });
  });

  test("for unresolved pages", async () => {
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
      "ui/pages/about.tsx":
        "export default function Aboutpage () {return 'a';}",
      "node_modules/m2/build/ui/pages/about.js":
        "export default function Aboutpage () {return 'a';} export const getInitialProps = () => {};",
      "node_modules/m2/build/ui/pages/contact.js":
        "export default function Contactpage () {return 'a';} export const getInitialProps = () => {}; export const Contact = 10;",
      "node_modules/m2/build/ui/pages/survey.js":
        "export default function Surveypage () {return 'a';}",

      "node_modules/m3/build/ui/pages/about.js":
        "export default function Aboutpage () {return 'a';} export const getInitialProps = () => {};",
      "node_modules/m3/build/ui/pages/contact.js":
        "export default function Contactpage () {return 'a';} export const getInitialProps = () => {}; export const Contact = 10;",
      "node_modules/m3/build/ui/pages/about/me.js":
        "export default function AbountMepage () {return 'a';}"
    });
    await expect(createPages(dir, ["somod"])).rejects.toEqual(
      new ErrorSet([
        new Error(
          `Following namespaces are unresolved
UI Page
 - contact
   - m2
   - m3`
        )
      ])
    );
  });
});
