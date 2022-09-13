import { get as getExports, Exports } from "../../src/utils/exports";
import { join as pathJoin } from "path";
import { sync as rimrafSync } from "rimraf";
import { createFiles, createTempDir } from "../utils";
import { isString } from "lodash";

describe("Test getExports with invalid inputs", () => {
  test("no input", () => {
    //@ts-expect-error no input argument to test
    expect(() => getExports()).toThrowError(
      'The "path" argument must be of type string or an instance of Buffer or URL. Received undefined'
    );
  });

  test("empty string", () => {
    expect(() => getExports("")).toThrowError("no such file or directory");
  });

  test("non existing file", () => {
    expect(() =>
      getExports(pathJoin(createTempDir("test-somod-lib"), "mycode.ts"))
    ).toThrowError("no such file or directory");
  });
});

const template = (
  description: string,
  code: string | Record<string, string>,
  expectedExports: Exports,
  expectedError?: string
) => {
  describe(description, () => {
    let dir: string = null;
    let file = null;
    beforeEach(() => {
      dir = createTempDir("test-somod-lib");
      const files = isString(code) ? { "code.ts": code } : code;
      file = Object.keys(files)[0];
      createFiles(dir, files);
    });

    afterEach(() => {
      rimrafSync(dir);
    });

    test("test", () => {
      if (expectedError) {
        const _expectedError = expectedError
          .replace("${PATH}", pathJoin(dir, file))
          .replace(/\$\{DIR\}/g, pathJoin(dir));
        expect(() => getExports(pathJoin(dir, file))).toThrowError(
          _expectedError
        );
      } else {
        expect(getExports(pathJoin(dir, file))).toEqual(expectedExports);
      }
    });
  });
};

template("Test getExports with empty Code", "", { default: false, named: [] });

template("Test getExports with invalid Code", "myCode(", null, "')' expected");

template(
  "Test getExports with valid Code",
  `import * as React from "react";
export declare type EntryLayoutProps = {
    title?: React.ReactNode;
    subTitle?: React.ReactNode;
};
declare const EntryLayout: React.FunctionComponent<EntryLayoutProps>;
export default EntryLayout;`,
  { default: true, named: ["EntryLayoutProps"] }
);

template(
  "Test getExports with valid Code with no exports",
  `import * as React from "react";
  declare type EntryLayoutProps = {
      title?: React.ReactNode;
      subTitle?: React.ReactNode;
  };
  declare const EntryLayout: React.FunctionComponent<EntryLayoutProps>;
  `,
  { default: false, named: [] }
);

template(
  "Test getExports with valid Code with named export of const",
  `import * as React from "react";
  declare type EntryLayoutProps = {
      title?: React.ReactNode;
      subTitle?: React.ReactNode;
  };
  export declare const EntryLayout: React.FunctionComponent<EntryLayoutProps>;
  `,
  { default: false, named: ["EntryLayout"] }
);

template(
  "Test getExports with function export",
  `export function f1(){};
export default function f2(){};
  `,
  { default: true, named: ["f1"] }
);

template(
  "Test getExports with multiple named const exports",
  `export declare const A: string, B: string;`,
  { default: false, named: ["A", "B"] }
);

template("Test getExports with class expression", `export const A = class {}`, {
  default: false,
  named: ["A"]
});

template(
  "Test getExports with tsx code",
  `import * as React from "react";
export const A = (): JSX.Element => {
  return <h1>Hello World</h1>;
}`,
  {
    default: false,
    named: ["A"]
  }
);

template(
  "Test getExports with class declaration",
  `export class A{}; export default class B{}`,
  { default: true, named: ["A"] }
);

template(
  "Test getExports with class expression",
  `export const A = class {}; const B = class {}; export default B`,
  { default: true, named: ["A"] }
);

template(
  "Test getExports with function declaration",
  `export function A(){}; export default function B(){}`,
  { default: true, named: ["A"] }
);

template("Test getExports with enum declaration", `export enum A{One, Two};`, {
  default: false,
  named: ["A"]
});

template(
  "Test getExports with interface declaration",
  `export interface A{}; export default interface B{}`,
  { default: true, named: ["A"] }
);

template(
  "Test getExports with export variable declaration with Object pattern and array pattern",
  `export const {A, B:[X, {Y}, [Z]], C : P} = D;`,
  { default: false, named: ["A", "X", "Y", "Z", "P"] }
);

template(
  "Test getExports with export from another module",
  `export {default as A, B, C as X, D as default} from 'a'`,
  { default: true, named: ["A", "B", "X"] }
);

template(
  "Test getExports with export All as default declaration",
  `export * as default from 'a'`,
  {
    default: true,
    named: []
  }
);

template(
  "Test getExports with export All as named declaration",
  `export * as A from 'a'`,
  {
    default: false,
    named: ["A"]
  }
);

template(
  "Test getExports with export All from module declaration",
  `export * from 'a';`,
  {
    default: false,
    named: []
  },
  "export * from module is not supported in ${PATH}"
);

template(
  "Test getExports with export All from ts file declaration",
  { "code.ts": `export * from "./a";`, "a.ts": "export const A = 10;" },
  {
    default: false,
    named: ["A"]
  }
);

template(
  "Test getExports with export All from tsx file declaration",
  { "code.ts": `export * from "./a";`, "a.tsx": "export const A = 10;" },
  {
    default: false,
    named: ["A"]
  }
);

template(
  "Test getExports with export All from deep declaration",
  {
    "code.ts": `export * from "./a";`,
    "a.tsx": 'export const A = 10; export * from "./b/c";',
    "b/c.ts":
      'export const C = 20; export const C1 = 25; export * from "../d";',
    "d.ts": "export const D = 30; const D1 = 23; export default D1;"
  },
  {
    default: false,
    named: ["A", "C", "C1", "D"]
  }
);

template(
  "Test getExports with export All declaration from js file",
  { "code.ts": `export * from "./a";`, "a.js": "export const A = 10;" },
  {
    default: false,
    named: []
  },
  'unable to resolve module "./a" in ${PATH}'
);

template(
  "Test getExports with export All declaration from js to js",
  { "code.js": `export * from "./a";`, "a.js": "export const A = 10;" },
  {
    default: false,
    named: ["A"]
  }
);

template(
  "Test getExports with export All declaration from js to ts",
  { "code.js": `export * from "./a";`, "a.ts": "export const A = 10;" },
  {
    default: false,
    named: []
  },
  'unable to resolve module "./a" in ${PATH}'
);

template(
  "Test getExports with export All declaration from .d.ts to .d.ts",
  { "code.d.ts": `export * from "./a";`, "a.d.ts": "export const A = 10;" },
  {
    default: false,
    named: ["A"]
  }
);

template(
  "Test getExports with export All declaration from .d.ts to js",
  { "code.d.ts": `export * from "./a";`, "a.js": "export const A = 10;" },
  {
    default: false,
    named: []
  },
  'unable to resolve module "./a" in ${PATH}'
);

template(
  "Test getExports with export All declaration from jsx",
  { "code.jsx": `export * from "./a";`, "a.jsx": "export const A = 10;" },
  {
    default: false,
    named: []
  },
  'export * is not supported for file type ".jsx" in ${PATH}'
);

template(
  "Test getExports with export assignment",
  `export = {};`,
  {
    default: false,
    named: []
  },
  "export assignment is not allowed in ${PATH}"
);

template(
  "Test getExports with export namespace",
  `export namespace A {
    export const B = 10;
  };`,
  {
    default: false,
    named: ["A"]
  }
);

template(
  "Test getExports with repeated named exports",
  `export const A = 10;export function A(){};`,
  { default: false, named: [] },
  "A is exported more than once. exported 2 times in ${PATH}"
);

template(
  "Test getExports with repeated named exports from multiple files",
  {
    "code.js":
      'export * from "./lib";\nexport * from "./serverless/functionIndex";',
    "lib/index.js": "export const A = 10;",
    "serverless/functionIndex.js": "export const A = 20;\nexport const B = 5;"
  },
  { default: false, named: [] },
  "A is exported more than once. exported 2 times in ${PATH}"
);
