import { createFiles, createTempDir, deleteDir } from "../../utils";
import { updatePackageJson } from "../../../src";
import { read as readPackageJson } from "../../../src/utils/packageJson";

describe("Test Task updatePackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  const allRightPackageJson = {
    name: "@my-scope/my-module",
    version: "1.0.1",
    description: "",
    module: "build/lib/index.js",
    typings: "build/lib/index.d.ts",
    files: ["build"],
    sideEffects: false
  };

  const somod = {
    somod: "1.2.3"
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
      "with somod",
      {
        ...allRightPackageJson,
        ...somod
      }
    ],
    [
      "wrong module",
      {
        ...allRightPackageJson,
        ...somod,
        module: "build/lib/index.ts"
      }
    ],
    [
      "wrong typings",
      {
        ...allRightPackageJson,
        ...somod,
        typings: "dist/lib/index.ts"
      }
    ],
    [
      "wrong files",
      {
        ...allRightPackageJson,
        ...somod,
        files: []
      }
    ],
    [
      "wrong sideEffects",
      {
        ...allRightPackageJson,
        ...somod,
        sideEffects: true
      }
    ],
    [
      "not-allowed keys",
      {
        ...allRightPackageJson,
        ...somod,
        main: "build/lib/index.js",
        "jsnext:main": "build/lib/index.js",
        type: "esm"
      }
    ]
  ];

  test.each(testData)("with %s", async (title, content) => {
    createFiles(dir, { "package.json": JSON.stringify(content) });

    await updatePackageJson(dir);
    const result = await readPackageJson(dir);
    expect(result).toMatchSnapshot({
      somod: expect.any(String)
    });
  });
});
