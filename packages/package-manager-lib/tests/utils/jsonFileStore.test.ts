import { createFiles, createTempDir, deleteDir } from "../utils";
import { read, update, save } from "../../src/utils/jsonFileStore";
import { join } from "path";
import { readFile } from "fs/promises";

describe("Test Util jsonFileStore", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for the flow", async () => {
    const path = join(dir, "package.json");

    // read with out file
    await expect(read(path)).rejects.toMatchObject({
      message: expect.stringContaining(
        "no such file or directory, open '" + join(path) + "'"
      )
    });

    // read with file
    createFiles(dir, { "package.json": "{}" });
    const jsonContent = await read(path);
    expect(jsonContent).toEqual({});

    // read after external modification
    jsonContent.name = "james";
    await expect(read(path)).resolves.toEqual({});

    // read after update
    update(path, jsonContent);
    await expect(read(path)).resolves.toEqual({ name: "james" });

    //check file before save
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual("{}");

    //check file after save
    await save(path);
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual(
      `{
  "name": "james"
}`
    );

    // read after second external modification
    jsonContent.age = 30;
    await expect(read(path)).resolves.toEqual({ name: "james" });

    // read after second update
    update(path, jsonContent);
    await expect(read(path)).resolves.toEqual({ name: "james", age: 30 });

    //check file before second save
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual(
      JSON.stringify({ name: "james" }, null, 2)
    );

    //check file after second save
    await save(path);
    await expect(readFile(path, { encoding: "utf8" })).resolves.toEqual(
      `{
  "name": "james",
  "age": 30
}`
    );
  });
});
