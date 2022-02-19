import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesNjpIsSetInPackageJson } from "../../../src";

describe("Test Task doesNjpIsSetInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no njp set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesNjpIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `njp must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test("for njp = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ njp: true }) });
    await expect(doesNjpIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `njp must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test('for njp = "v1.0.2"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ njp: "v1.0.2" }) });
    await expect(doesNjpIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `njp must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test('for njp = "1.0.2"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ njp: "1.0.2" }) });
    await expect(doesNjpIsSetInPackageJson(dir)).resolves.toBeUndefined();
  });
});
