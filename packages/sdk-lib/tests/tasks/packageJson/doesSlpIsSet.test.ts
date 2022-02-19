import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesSlpIsSetInPackageJson } from "../../../src";

describe("Test Task doesSlpIsSetInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no slp set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesSlpIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `slp must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test("for slp = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ slp: true }) });
    await expect(doesSlpIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `slp must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test('for slp = "v1.0.2"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ slp: "v1.0.2" }) });
    await expect(doesSlpIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `slp must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test('for slp = "1.0.2"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ slp: "1.0.2" }) });
    await expect(doesSlpIsSetInPackageJson(dir)).resolves.toBeUndefined();
  });
});
