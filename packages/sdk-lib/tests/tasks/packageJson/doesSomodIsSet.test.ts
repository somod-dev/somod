import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesSomodIsSetInPackageJson } from "../../../src";

describe("Test Task doesSomodIsSetInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no somod set", async () => {
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesSomodIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `somod must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test("for somod = true", async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: true }) });
    await expect(doesSomodIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `somod must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test('for somod = "v1.0.2"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: "v1.0.2" }) });
    await expect(doesSomodIsSetInPackageJson(dir)).rejects.toEqual(
      new Error(
        `somod must match '/^[0-9]+\\.[0-9]+\\.[0-9]+$/' pattern in ${dir}/package.json`
      )
    );
  });

  test('for somod = "1.0.2"', async () => {
    createFiles(dir, { "package.json": JSON.stringify({ somod: "1.0.2" }) });
    await expect(doesSomodIsSetInPackageJson(dir)).resolves.toBeUndefined();
  });
});
