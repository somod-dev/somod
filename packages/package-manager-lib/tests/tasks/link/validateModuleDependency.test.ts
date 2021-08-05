import { validateModuleDependency } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test task validateModuleDependency", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir();
  });
  afterEach(() => {
    deleteDir(dir);
  });

  test("for non module dir with multiple indicators", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "m1", version: "1.0.0" })
    });
    await expect(validateModuleDependency(dir, ["njp", "slp"])).rejects.toEqual(
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
    await expect(
      validateModuleDependency(dir, ["njp"])
    ).resolves.toBeUndefined();
  });
});
