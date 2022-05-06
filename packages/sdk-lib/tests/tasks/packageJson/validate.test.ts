import { createFiles, createTempDir, deleteDir } from "../../utils";
import { validatePackageJson } from "../../../src";
import { join } from "path";

describe("Test Task validatePackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const allRightPackageJson = {
    name: "@my-scope/my-module",
    version: "1.0.1",
    description: "",
    module: "build/index.js",
    typings: "build/index.d.ts",
    files: ["build"],
    sideEffects: false
  };

  const njp = {
    njp: "1.2.3"
  };

  const testData: [string, Record<string, unknown>][] = [
    ["empty", {}],
    [
      "normal",
      {
        name: "@my-scope/my-module",
        version: "1.0.1",
        description: ""
      }
    ],
    [
      "no sodaru module key",
      {
        ...allRightPackageJson
      }
    ],
    [
      "njp and somod",
      {
        ...allRightPackageJson,
        ...njp,
        somod: "1.2.3"
      }
    ],
    [
      "only njp",
      {
        ...allRightPackageJson,
        ...njp
      }
    ],
    [
      "wrong module",
      {
        ...allRightPackageJson,
        ...njp,
        module: "build/index.ts"
      }
    ],
    [
      "wrong typings",
      {
        ...allRightPackageJson,
        ...njp,
        typings: "dist/index.ts"
      }
    ],
    [
      "wrong files",
      {
        ...allRightPackageJson,
        ...njp,
        files: []
      }
    ],
    [
      "wrong sideEffects",
      {
        ...allRightPackageJson,
        ...njp,
        sideEffects: true
      }
    ],
    [
      "not-allowed keys",
      {
        ...allRightPackageJson,
        ...njp,
        main: "build/index.js",
        "jsnext:main": "build/index.js",
        type: "esm"
      }
    ],
    [
      "only somod set for njp module",
      { ...allRightPackageJson, somod: "1.2.3" }
    ]
  ];

  test.each(testData)("with %s", async (title, content) => {
    createFiles(dir, { "package.json": JSON.stringify(content) });

    let error: string;
    try {
      await validatePackageJson(dir, "njp");
    } catch (e) {
      error = e.message;
    }
    expect(
      error?.replace(
        join(dir, "package.json").split("\\").join("/"),
        "package.json"
      )
    ).toMatchSnapshot();
  });
});
