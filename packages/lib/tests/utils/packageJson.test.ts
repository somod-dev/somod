import { createFiles, createTempDir, deleteDir } from "../utils";
import { read, update } from "../../src/utils/packageJson";
import { join } from "path";

describe("Test Util packageJson.read", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });
  test("for non existing file", async () => {
    expect.assertions(1);
    await expect(read(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "no such file or directory, open '" + join(dir, "package.json") + "'"
      )
    });
  });

  test("for invalid json file", async () => {
    expect.assertions(1);
    createFiles(dir, { "package.json": "" });
    await expect(read(dir)).rejects.toMatchObject({
      message: expect.stringContaining("Unexpected end of JSON input")
    });
  });

  test("for valid file", async () => {
    expect.assertions(1);
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "test-package" })
    });
    await expect(read(dir)).resolves.toEqual({
      name: "test-package"
    });
  });
});

describe("Test Util packageJson.update", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for valid file", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "test-package" })
    });
    expect(update(dir, { name: "some-package" })).toBeUndefined();
    await expect(read(dir)).resolves.toEqual({ name: "some-package" });
  });
});
