import { createFiles, createTempDir, deleteDir } from "../../utils";
import { updatePackageJson } from "../../../src";
import { read as readPackageJson } from "../../../src/utils/packageJson";

describe("Test Task updatePackageJson", () => {
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
    module: "build/lib/index.js",
    typings: "build/lib/index.d.ts",
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
        module: "build/lib/index.ts"
      }
    ],
    [
      "wrong typings",
      {
        ...allRightPackageJson,
        ...njp,
        typings: "dist/lib/index.ts"
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
        main: "build/lib/index.js",
        "jsnext:main": "build/lib/index.js",
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

    await updatePackageJson(dir, "njp");
    const result = await readPackageJson(dir);
    expect(result).toMatchSnapshot({
      njp: expect.any(String)
    });
  });

  test("with type = slp", async () => {
    createFiles(dir, { "package.json": "{}" });

    await updatePackageJson(dir, "slp");
    const result = await readPackageJson(dir);
    expect(result).toMatchSnapshot({
      slp: expect.any(String)
    });
  });

  test("with type = somod", async () => {
    createFiles(dir, { "package.json": "{}" });

    await updatePackageJson(dir, "somod");
    const result = await readPackageJson(dir);
    expect(result).toMatchSnapshot({
      somod: expect.any(String)
    });
  });
});
