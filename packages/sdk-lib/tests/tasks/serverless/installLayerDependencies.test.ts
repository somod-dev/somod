import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { existsSync } from "fs";
import { join } from "path";
import { installLayerDependencies } from "../../../src";

describe("Test Task installLayerDependencies", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no layers", async () => {
    await expect(installLayerDependencies(dir)).resolves.toBeUndefined();
  });

  test("with empty layers", async () => {
    createFiles(dir, { "build/serverless/functionLayers/": "" });
    await expect(installLayerDependencies(dir)).resolves.toBeUndefined();
  });

  test("with one layer", async () => {
    createFiles(dir, {
      "build/serverless/functionLayers/l1/nodejs/package.json": JSON.stringify(
        { name: "l1", dependencies: { lodash: "^4.17.21" } },
        null,
        2
      )
    });
    await expect(installLayerDependencies(dir)).resolves.toBeUndefined();

    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/l1/nodejs/node_modules/lodash"
        )
      )
    ).toBeTruthy();
  }, 10000);

  test("with multiple layer", async () => {
    createFiles(dir, {
      "build/serverless/functionLayers/l1/nodejs/package.json": JSON.stringify(
        { name: "l1", dependencies: { lodash: "^4.17.21" } },
        null,
        2
      ),
      "build/serverless/functionLayers/l2/nodejs/package.json": JSON.stringify(
        { name: "l1", dependencies: { smallest: "^1.0.1" } },
        null,
        2
      )
    });
    await expect(installLayerDependencies(dir)).resolves.toBeUndefined();

    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/l1/nodejs/node_modules/lodash"
        )
      )
    ).toBeTruthy();

    expect(
      existsSync(
        join(
          dir,
          "build/serverless/functionLayers/l2/nodejs/node_modules/smallest"
        )
      )
    ).toBeTruthy();
  }, 20000);
});
