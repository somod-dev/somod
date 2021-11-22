import { join } from "path";
import { getModuleInfo } from "../../src/utils/moduleInfo";
import { createFiles, createTempDir, deleteDir } from "../utils";
import { ErrorSet } from "@sodaru/cli-base";

describe("Test util getModuleInfo", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir();
  });
  afterEach(() => {
    deleteDir(dir);
  });

  test("for no dir", async () => {
    expect(() => getModuleInfo(null, ["njp"])).toThrowError(
      'The "path" argument must be of type string. Received null'
    );
  });

  test("for empty string as dir", async () => {
    await expect(getModuleInfo("", ["njp"])).rejects.toEqual(
      new Error(" is not njp module")
    );
  });

  test("for no module indicator", async () => {
    await expect(getModuleInfo(dir, [])).rejects.toEqual(
      new Error("moduleIndicators must not be empty array")
    );
  });

  test("for non existing dir", async () => {
    const nonExistingDir = join(__dirname, "hhgrgiurehkwhgruii");
    await expect(getModuleInfo(nonExistingDir, ["njp"])).rejects.toHaveProperty(
      "message",
      `ENOENT: no such file or directory, open '${join(
        nonExistingDir,
        "package.json"
      )}'`
    );
  });

  test("for non module dir", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "m1", version: "1.0.0" })
    });
    await expect(getModuleInfo(dir, ["njp"])).rejects.toEqual(
      new Error(`${dir} is not njp module`)
    );
  });

  test("for non module dir with multiple indicators", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "m1", version: "1.0.0" })
    });
    await expect(getModuleInfo(dir, ["njp", "slp"])).rejects.toEqual(
      new Error(`${dir} is not njp or slp module`)
    );
  });

  test("for module without dependency", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        njp: true
      })
    });
    await expect(getModuleInfo(dir, ["njp"])).resolves.toEqual([
      { name: "m1", version: "1.0.0", dependencies: [], packageLocation: dir }
    ]);
  });

  test("for module with one level dependency", async () => {
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
      })
    });
    await expect(getModuleInfo(dir, ["njp"])).resolves.toEqual([
      {
        name: "m1",
        version: "1.0.0",
        dependencies: ["m2", "m3"],
        packageLocation: dir
      },
      {
        name: "m2",
        version: "1.0.10",
        dependencies: [],
        packageLocation: dir + "/node_modules/m2"
      },
      {
        name: "m3",
        version: "2.2.0",
        dependencies: [],
        packageLocation: dir + "/node_modules/m3"
      }
    ]);
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
      })
    });
    await expect(getModuleInfo(dir, ["njp"])).resolves.toEqual([
      {
        name: "m1",
        version: "1.0.0",
        dependencies: ["m2", "m3", "m4", "m5"],
        packageLocation: dir
      },
      {
        name: "m2",
        version: "1.0.10",
        dependencies: ["m4", "m5"],
        packageLocation: dir + "/node_modules/m2"
      },
      {
        name: "m4",
        version: "3.6.0",
        dependencies: [],
        packageLocation: dir + "/node_modules/m4"
      },
      {
        name: "m5",
        version: "4.6.0",
        dependencies: [],
        packageLocation: dir + "/node_modules/m2/node_modules/m5"
      },
      {
        name: "m3",
        version: "2.2.0",
        dependencies: [],
        packageLocation: dir + "/node_modules/m3"
      }
    ]);
  });

  test("for module with repeated dependency modules in diffferent versions", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        njp: true,
        dependencies: {
          m2: "^1.0.1",
          m4: "^3.4.1",
          m6: "^7.0.0"
        }
      }),
      "node_modules/m2/package.json": JSON.stringify({
        name: "m2",
        version: "1.0.10",
        dependencies: {
          m4: "^4.5.2"
        },
        njp: true
      }),
      "node_modules/m2/node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "4.6.0",
        njp: true
      }),
      "node_modules/m4/package.json": JSON.stringify({
        name: "m4",
        version: "3.5.1",
        njp: true
      }),
      "node_modules/m6/package.json": JSON.stringify({
        name: "m6",
        version: "7.1.7"
      })
    });
    await expect(getModuleInfo(dir, ["njp"])).rejects.toEqual(
      new ErrorSet([
        new Error(
          "module m4 has more than one version at 1. m1 -> m2 -> m4 (4.6.0), 2. m1 -> m4 (3.5.1)"
        )
      ])
    );
  });

  test("for multiple calls", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        njp: true
      })
    });

    const promise1 = getModuleInfo(dir, ["njp"]);

    const promise2 = getModuleInfo(dir, ["njp"]);

    expect(promise1 == promise2).toBeTruthy();

    const promise3 = getModuleInfo(dir, ["njp", "slp"]);

    expect(promise1 == promise3).toBeFalsy();

    await promise1;
    await promise2;
    await promise3;
  });
});
