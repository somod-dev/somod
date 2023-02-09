import { createFiles, createTempDir, deleteDir } from "nodejs-file-utils";
import { execPromise, execute } from "../utils";

describe("Test the somod command", () => {
  let dir: string;

  beforeAll(async () => {
    dir = createTempDir("test-somod-somod");
    createFiles(dir, {
      ".npmrc": "registry=http://localhost:8000",
      "package.json": JSON.stringify({ name: "sample", version: "1.0.0" })
    });
    await execPromise("npm i somod", dir);
  }, 60000);

  afterAll(() => {
    deleteDir(dir);
  });

  test("help", async () => {
    const result = await execute(
      dir,
      "npx",
      ["somod", "-h"],
      { return: "on", show: "off" },
      { return: "on", show: "off" }
    );
    expect(result).toMatchInlineSnapshot(`
      Object {
        "stderr": "",
        "stdout": "Usage: somod [options] [command]

      Options:
        --version                Print version of somod
        -h, --help               display help for command

      Commands:
        build [options]
        prepare [options]
        deploy [options]
        start [options]
        update-params [options]
      ",
      }
    `);
  });
});
