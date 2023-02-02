import { mkdir, symlink } from "fs/promises";
import { createTempDir, deleteDir } from "nodejs-file-utils";
import { join } from "path";
import { execute } from "../utils";

describe("Test the somod command", () => {
  let dir: string;

  beforeEach(async () => {
    dir = createTempDir("test-somod-somod");
    await mkdir(join(dir, "node_modules/.bin"), { recursive: true });
    await symlink(
      join(__dirname, "../../"),
      join(dir, "node_modules", "somod")
    );
    await symlink(
      join(dir, "node_modules", "somod", "bin", "somod.js"),
      join(dir, "node_modules", ".bin", "somod")
    );
  });

  afterEach(() => {
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
        "stderr": undefined,
        "stdout": "Usage: somod [options] [command]

      Options:
        --version                Print version of somod
        -h, --help               display help for command

      Commands:
        build [options]
        prepare [options]
        deploy [options]
        start [options]
        update-params [options]",
      }
    `);
  });
});
