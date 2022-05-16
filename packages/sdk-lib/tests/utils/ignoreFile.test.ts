import { createFiles, createTempDir, deleteDir } from "../utils";
import { update, validate } from "../../src/utils/ignoreFile";
import { join } from "path";
import { readIgnoreFileStore } from "@solib/cli-base";

describe("Test Util ignoreFile.validate", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });
  test("for non existing file", async () => {
    expect.assertions(1);
    await expect(validate(dir, [], ".someignore")).rejects.toMatchObject({
      message: expect.stringContaining(
        ".someignore is not found in any directory in the path " + dir
      )
    });
  });

  test("for valid file", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbuild"
    });
    await expect(validate(dir, [], ".someignore")).resolves.toBeUndefined();
  });

  test("for valid file with more paths", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbuild\nbin"
    });
    await expect(
      validate(dir, ["bin"], ".someignore")
    ).resolves.toBeUndefined();
  });

  test("for invalid file", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbin"
    });
    await expect(validate(dir, [], ".someignore")).rejects.toEqual(
      new Error(`build must be in ${dir}/.someignore`)
    );
  });

  test("for invalid file with more paths", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\n.next"
    });
    await expect(validate(dir, ["bin"], ".someignore")).rejects.toEqual(
      new Error(`build, bin must be in ${dir}/.someignore`)
    );
  });

  test("for valid file in parent dir", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbuild",
      "this/is/child/path/": ""
    });
    await expect(
      validate(join(dir, "this/is/child/path/"), [], ".someignore")
    ).resolves.toBeUndefined();
  });

  test("for invalid file", async () => {
    expect.assertions(1);
    createFiles(dir, {
      ".someignore": "node_modules\nbin",
      "this/is/child/path/": ""
    });
    await expect(
      validate(join(dir, "this/is/child/path/"), [], ".someignore")
    ).rejects.toEqual(new Error(`build must be in ${dir}/.someignore`));
  });
});

describe("Test Util ignoreFile.update", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for non existing file", async () => {
    await expect(update(dir, [], ".someignore")).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".someignore"))
    ).resolves.toEqual(["node_modules", "build"]);
  });

  test("for existing file", async () => {
    createFiles(dir, {
      ".someignore": "node_modules\nbin"
    });
    await expect(update(dir, [], ".someignore")).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".someignore"))
    ).resolves.toEqual(["node_modules", "bin", "build"]);
  });

  test("for existing file with extra paths", async () => {
    createFiles(dir, {
      ".someignore": "node_modules\nbin"
    });
    await expect(
      update(dir, ["bin", ".next", "/.slp"], ".someignore")
    ).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".someignore"))
    ).resolves.toEqual(["node_modules", "bin", "build", ".next", "/.slp"]);
  });

  test("for existing file with empty lines", async () => {
    createFiles(dir, {
      ".someignore": "\nnode_modules\n\nbin"
    });
    await expect(
      update(dir, ["bin", ".next"], ".someignore")
    ).resolves.toBeUndefined();
    await expect(
      readIgnoreFileStore(join(dir, ".someignore"))
    ).resolves.toEqual(["", "node_modules", "", "bin", "build", ".next"]);
  });

  test("for valid file in parent dir", async () => {
    createFiles(dir, {
      ".someignore": "node_modules\nbin",
      "this/is/child/path/": ""
    });
    await expect(
      update(
        join(dir, "this/is/child/path/"),
        ["bin", ".next", "/.slp"],
        ".someignore"
      )
    ).resolves.toBeUndefined();

    await expect(
      readIgnoreFileStore(join(dir, ".someignore"))
    ).resolves.toEqual([
      "node_modules",
      "bin",
      "build",
      ".next",
      "/this/is/child/path/.slp"
    ]);
  });
});
