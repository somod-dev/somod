import { createFiles, createTempDir, deleteDir } from "../utils";
import { read, update, save } from "../../src/utils/ignoreFileStore";
import { join } from "path";
import { readFile } from "fs/promises";

describe("Test Util ignoreFileStore", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for the flow", async () => {
    const path = join(dir, ".gitignore");

    // read with out file
    await expect(read(path)).rejects.toMatchObject({
      message: expect.stringContaining(
        "no such file or directory, open '" + join(path) + "'"
      )
    });

    // read with file
    createFiles(dir, { ".gitignore": "" });
    const ignoreContent = await read(path);
    expect(ignoreContent).toEqual([]);

    // read after external modification
    ignoreContent.push("node_modules");
    await expect(read(path)).resolves.toEqual([]);

    // read after update
    update(path, ignoreContent);
    await expect(read(path)).resolves.toEqual(["node_modules"]);

    //check file before save
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual("");

    //check file after save
    await save(path);
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual(
      `node_modules`
    );

    // read after second external modification
    ignoreContent.push("/build");
    await expect(read(path)).resolves.toEqual(["node_modules"]);

    // read after second update
    update(path, ignoreContent);
    await expect(read(path)).resolves.toEqual(["node_modules", "/build"]);

    //check file before second save
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual(
      "node_modules"
    );

    //check file after second save
    await save(path);
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual(
      `node_modules
/build`
    );
  });
});
