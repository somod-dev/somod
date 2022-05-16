import { readFile } from "fs/promises";
import { join } from "path";
import { createNjpConfigJson } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task createNjpConfigJson", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("without prior file", async () => {
    await expect(createNjpConfigJson(dir)).resolves.toBeUndefined();
    const resultContent = await readFile(join(dir, "njp.config.json"), {
      encoding: "utf8"
    });

    expect(resultContent).toEqual("{}");
  });

  test("with prior file", async () => {
    createFiles(dir, { "njp.config.json": "{imageDomains: []}" });
    await expect(createNjpConfigJson(dir)).resolves.toBeUndefined();
    const resultContent = await readFile(join(dir, "njp.config.json"), {
      encoding: "utf8"
    });

    expect(resultContent).toEqual(`{}`);
  });
});
