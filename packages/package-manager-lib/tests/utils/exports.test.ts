import { get as getExports, Exports } from "../../src/utils/exports";
import { writeFileSync } from "fs";
import { join as pathJoin } from "path";
import { sync as rimrafSync } from "rimraf";
import { createFiles, createTempDir } from "../utils";

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
      getExports(pathJoin(createTempDir(), "mycode.ts"))
    ).toThrowError("no such file or directory");
  });
});

const template = (
  description: string,
  code: string,
  expectedExports: Exports,
  expectedError?: string,
  files?: Record<string, string>
) => {
  describe(description, () => {
    let dir: string = null;
    beforeEach(() => {
      dir = createTempDir();
      writeFileSync(pathJoin(dir, "code.ts"), code);
      if (files) {
        createFiles(dir, files);
      }
    });

    afterEach(() => {
      rimrafSync(dir);
    });

    test("test", () => {
      if (expectedError) {
        const _expectedError = expectedError.replace(
          "${PATH}",
          pathJoin(dir, "code.ts")
        );
        expect(() => getExports(pathJoin(dir, "code.ts"))).toThrowError(
          _expectedError
        );
      } else {
        expect(getExports(pathJoin(dir, "code.ts"))).toEqual(expectedExports);
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
  `export * from "./a";`,
  {
    default: false,
    named: ["A"]
  },
  null,
  { "a.ts": "export const A = 10;" }
);

template(
  "Test getExports with export All from tsx file declaration",
  `export * from "./a";`,
  {
    default: false,
    named: ["A"]
  },
  null,
  { "a.tsx": "export const A = 10;" }
);

template(
  "Test getExports with export All from deep declaration",
  `export * from "./a";`,
  {
    default: false,
    named: ["A", "C", "C1", "D"]
  },
  null,
  {
    "a.tsx": 'export const A = 10; export * from "./b/c";',
    "b/c.ts":
      'export const C = 20; export const C1 = 25; export * from "../d";',
    "d.ts": "export const D = 30; const D1 = 23; export default D1;"
  }
);

template(
  "Test getExports with export All declaration from js file",
  `export * from "./a";`,
  {
    default: false,
    named: []
  },
  "export * is supported only from .ts or .tsx files in ${PATH}",
  { "a.js": "export const A = 10;" }
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
