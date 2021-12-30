import { createFiles, createTempDir, deleteDir } from "../../utils";
import { doesSomodIsTrueInPackageJson } from "../../../src";

describe("Test Task doesSomodIsTrueInPackageJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no somod set", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({}) });
    await expect(doesSomodIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`somod must be true in ${dir}/package.json`)
    );
  });

  test("for somod = true", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ somod: true }) });
    await expect(doesSomodIsTrueInPackageJson(dir)).resolves.toBeUndefined();
  });

  test("for somod = false", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ somod: false }) });
    await expect(doesSomodIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`somod must be true in ${dir}/package.json`)
    );
  });

  test('for somod = "true"', async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": JSON.stringify({ somod: "true" }) });
    await expect(doesSomodIsTrueInPackageJson(dir)).rejects.toEqual(
      new Error(`somod must be true in ${dir}/package.json`)
    );
  });
});
