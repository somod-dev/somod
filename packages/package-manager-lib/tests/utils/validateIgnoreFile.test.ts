import { createFiles, createTempDir, deleteDir } from "../utils";
import validateIgnoreFile from "../../src/utils/validateIgnoreFile";
import { join } from "path";

describe("Test Util validateIgnoreFile", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });
  test("for non existing file", async () => {
    expect.assertions(1);
    await expect(
      validateIgnoreFile(dir, [], ".someignore")
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "no such file or directory, open '" + join(dir, ".someignore") + "'"
      )
    });
  });

  test("for valid file", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbuild"
    });
    await expect(
      validateIgnoreFile(dir, [], ".someignore")
    ).resolves.toBeUndefined();
  });

  test("for valid file with more paths", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbuild\nbin"
    });
    await expect(
      validateIgnoreFile(dir, ["bin"], ".someignore")
    ).resolves.toBeUndefined();
  });

  test("for invalid file", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbin"
    });
    await expect(validateIgnoreFile(dir, [], ".someignore")).rejects.toEqual(
      new Error(`build must be in ${dir}/.someignore`)
    );
  });

  test("for invalid file with more paths", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\n.next"
    });
    await expect(
      validateIgnoreFile(dir, ["bin"], ".someignore")
    ).rejects.toEqual(new Error(`build, bin must be in ${dir}/.someignore`));
  });
});
