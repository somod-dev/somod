import { join } from "path";
import { validateDependencyModules } from "../../../src/tasks/build/validateDependencyModules";
import { createFiles, createTempDir, deleteDir } from "../../utils";
import { ErrorSet } from "@sodaru/cli-base";

describe("Test task validateDependencyModules", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir();
  });
  afterEach(() => {
    deleteDir(dir);
  });

  test("for no module indicator", async () => {
    await expect(validateDependencyModules(dir, [])).rejects.toEqual(
      new Error("moduleIndicators must not be empty array")
    );
  });

  test("for non existing dir", async () => {
    const nonExistingDir = join(__dirname, "hhgrgiurehkwhgruii");
    await expect(
      validateDependencyModules(nonExistingDir, ["njp"])
    ).rejects.toHaveProperty(
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
    await expect(validateDependencyModules(dir, ["njp"])).rejects.toEqual(
      new Error(`${dir} is not njp module`)
    );
  });

  test("for non module dir with multiple indicators", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "m1", version: "1.0.0" })
    });
    await expect(
      validateDependencyModules(dir, ["njp", "slp"])
    ).rejects.toEqual(new Error(`${dir} is not njp or slp module`));
  });

  test("for module without dependency", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        njp: true
      })
    });
    await expect(
      validateDependencyModules(dir, ["njp"])
    ).resolves.toBeUndefined();
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
    await expect(
      validateDependencyModules(dir, ["njp"])
    ).resolves.toBeUndefined();
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
    await expect(
      validateDependencyModules(dir, ["njp"])
    ).resolves.toBeUndefined();
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
    await expect(validateDependencyModules(dir, ["njp"])).rejects.toEqual(
      new ErrorSet([
        new Error(
          "module m4 has more than one version at 1. m1 -> m2 -> m4 (4.6.0), 2. m1 -> m4 (3.5.1)"
        )
      ])
    );
  });
});
