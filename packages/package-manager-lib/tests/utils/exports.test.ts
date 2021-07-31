import { get as getExports, Exports } from "../../src/utils/exports";
import { writeFileSync } from "fs";
import { join as pathJoin } from "path";
import { sync as rimrafSync } from "rimraf";
import { createTempDir } from "../utils";

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
  expectedError?: string
) => {
  describe(description, () => {
    let dir: string = null;
    beforeEach(() => {
      dir = createTempDir();
      writeFileSync(pathJoin(dir, "code.ts"), code);
    });

    afterEach(() => {
      rimrafSync(dir);
    });

    test("test", () => {
      if (expectedError) {
        expect(() => getExports(pathJoin(dir, "code.ts"))).toThrowError(
          expectedError
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
