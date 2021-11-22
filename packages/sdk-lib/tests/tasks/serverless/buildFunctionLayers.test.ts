import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { buildFunctionLayers } from "../../../src";
import { createFiles, createTempDir, deleteDir } from "../../utils";

describe("Test Task buildFunctionLayers", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for no serverless dir", async () => {
    await expect(buildFunctionLayers(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for no function-layers dir", async () => {
    createFiles(dir, { "serverless/": "" });
    await expect(buildFunctionLayers(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).toBeFalsy();
  });

  test("for empty function-layers dir", async () => {
    createFiles(dir, { "serverless/function-layers/": "" });
    await expect(buildFunctionLayers(dir)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build/serverless"))).toBeFalsy();
  });

  test("for function-layers with sub directories", async () => {
    createFiles(dir, {
      "serverless/function-layers/omg/layer1.json": JSON.stringify(
        { name: "sample-layer", dependencies: { a: "^1.0.0" } },
        null,
        2
      )
    });
    await expect(buildFunctionLayers(dir)).rejects.toMatchObject({
      message: expect.stringContaining("illegal operation on a directory, read")
    });
  });

  test("for function-layers with invalid json", async () => {
    createFiles(dir, {
      "serverless/function-layers/layer1.json": "console.log('test');"
    });
    await expect(buildFunctionLayers(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "Unexpected token c in JSON at position 0"
      )
    });
  });

  test("for valid function-layers dir", async () => {
    createFiles(dir, {
      "serverless/function-layers/layer1.json": JSON.stringify(
        { name: "sample-layer", dependencies: { a: "^1.0.0" } },
        null,
        2
      ),
      "serverless/function-layers/layer2.json": JSON.stringify(
        { name: "another-layer", dependencies: { a: "^1.0.0", b: "^1.0.0" } },
        null,
        2
      )
    });
    await expect(buildFunctionLayers(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/serverless/function-layers/layer1.json"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      JSON.stringify({ name: "sample-layer", dependencies: { a: "^1.0.0" } })
    );

    await expect(
      readFile(join(dir, "build/serverless/function-layers/layer2.json"), {
        encoding: "utf8"
      })
    ).resolves.toEqual(
      JSON.stringify({
        name: "another-layer",
        dependencies: { a: "^1.0.0", b: "^1.0.0" }
      })
    );
  });
});
