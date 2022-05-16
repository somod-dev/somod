import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";
import { updateNjpConfig } from "../../../src";
import { Config } from "../../../src/utils/nextJs/config";
import { ErrorSet } from "@solib/cli-base";

describe("Test Task updateNjpConfig", () => {
  let dir: string = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with empty dir", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample", njp: "1.2.3" })
    });
    await expect(updateNjpConfig(dir, ["njp"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "njp.config.json"), { encoding: "utf8" })
    ).resolves.toMatchSnapshot();
    await expect(
      readFile(join(dir, ".env"), { encoding: "utf8" })
    ).resolves.toMatchSnapshot();
  });

  test("with content in root build dir", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample", njp: "1.2.3" }),
      "build/ui/config.json": JSON.stringify(
        {
          env: {
            DB_HOST: { default: "localhost", schema: { type: "string" } }
          },
          imageDomains: ["sodaru.com", "cloud.sodaru.com"],
          runtimeConfig: {
            theme: {
              default: { palette: { primary: { main: "#004b89" } } },
              label: "Theme",
              schema: { type: "object" }
            }
          },
          serverRuntimeConfig: {
            googleRecaptchaApiKey: {
              schema: { type: "string" }
            }
          }
        } as Config,
        null,
        2
      )
    });
    await expect(updateNjpConfig(dir, ["njp"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "njp.config.json"), { encoding: "utf8" })
    ).resolves.toMatchSnapshot();
    await expect(
      readFile(join(dir, ".env"), { encoding: "utf8" })
    ).resolves.toMatchSnapshot();
  });

  test("with validateOnly and content in root build dir", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({ name: "sample", njp: "1.2.3" }),
      "build/ui/config.json": JSON.stringify(
        {
          env: {
            DB_HOST: { default: "localhost", schema: { type: "string" } }
          },
          imageDomains: ["sodaru.com", "cloud.sodaru.com"],
          runtimeConfig: {
            theme: {
              default: { palette: { primary: { main: "#004b89" } } },
              label: "Theme",
              schema: { type: "object" }
            }
          },
          serverRuntimeConfig: {
            googleRecaptchaApiKey: {
              schema: { type: "string" }
            }
          }
        } as Config,
        null,
        2
      )
    });
    await expect(updateNjpConfig(dir, ["njp"], true)).resolves.toBeUndefined();
    expect(existsSync(join(dir, "njp.config.json"))).not.toBeTruthy();
    expect(existsSync(join(dir, ".env"))).not.toBeTruthy();
  });

  test("with conflicting content", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "sample",
        njp: "1.2.3",
        dependencies: { pkg1: "^1.2.3", pkg2: "^2.3.4" }
      }),
      "build/ui/config.json": JSON.stringify({} as Config, null, 2),
      "node_modules/pkg1/package.json": JSON.stringify({
        name: "pkg1",
        njp: "1.2.3"
      }),
      "node_modules/pkg1/build/ui/config.json": JSON.stringify(
        {
          env: { DB_HOST: { schema: { type: "string" } } },
          runtimeConfig: {
            theme: {
              default: { palette: { primary: { main: "#004b89" } } },
              label: "Theme",
              schema: { type: "object" }
            },
            recaptchaSiteKey: {
              schema: { type: "string" }
            }
          }
        } as Config,
        null,
        2
      ),
      "node_modules/pkg2/package.json": JSON.stringify({
        name: "pkg2",
        njp: "1.2.3"
      }),
      "node_modules/pkg2/build/ui/config.json": JSON.stringify(
        {
          env: {
            DB_HOST: { schema: { type: "string" } },
            DB_PORT: { schema: { type: "string" } }
          },
          runtimeConfig: {
            theme: {
              default: { palette: { primary: { main: "#004b89" } } },
              label: "Theme",
              schema: { type: "object" }
            }
          },
          serverRuntimeConfig: {
            recaptchaApiKey: {
              default: "",
              schema: { type: "string" }
            }
          }
        } as Config,
        null,
        2
      )
    });
    await expect(updateNjpConfig(dir, ["njp"])).rejects.toEqual(
      new ErrorSet([
        new Error(
          "Error while resolving (pkg1, pkg2) modules for the env 'DB_HOST': Can not resolve"
        ),
        new Error(
          "Error while resolving (pkg1, pkg2) modules for the runtimeConfig 'theme': Can not resolve"
        )
      ])
    );
  });

  test("with resolved conflicting content", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "sample",
        njp: "1.2.3",
        dependencies: { pkg1: "^1.2.3", pkg2: "^2.3.4" }
      }),
      "build/ui/config.json": JSON.stringify(
        {
          env: {
            DB_HOST: { schema: { type: "string" }, default: "localhost" },
            DB_PORT: { schema: { type: "string" }, default: "8080" }
          },
          runtimeConfig: {
            theme: {
              default: { palette: { primary: { main: "#000000" } } },
              label: "Theme",
              schema: { type: "object" }
            }
          }
        } as Config,
        null,
        2
      ),
      "node_modules/pkg1/package.json": JSON.stringify({
        name: "pkg1",
        njp: "1.2.3"
      }),
      "node_modules/pkg1/build/ui/config.json": JSON.stringify(
        {
          env: { DB_HOST: { schema: { type: "string" } } },
          runtimeConfig: {
            theme: {
              default: { palette: { primary: { main: "#004b89" } } },
              label: "Theme",
              schema: { type: "object" }
            },
            recaptchaSiteKey: {
              schema: { type: "string" }
            }
          }
        } as Config,
        null,
        2
      ),
      "node_modules/pkg2/package.json": JSON.stringify({
        name: "pkg2",
        njp: "1.2.3"
      }),
      "node_modules/pkg2/build/ui/config.json": JSON.stringify(
        {
          env: {
            DB_HOST: { schema: { type: "string" } },
            DB_PORT: { schema: { type: "string" } }
          },
          runtimeConfig: {
            theme: {
              default: { palette: { primary: { main: "#004b89" } } },
              label: "Theme",
              schema: { type: "object" }
            }
          },
          serverRuntimeConfig: {
            recaptchaApiKey: {
              default: "",
              schema: { type: "string" }
            }
          }
        } as Config,
        null,
        2
      )
    });
    await expect(updateNjpConfig(dir, ["njp"])).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "njp.config.json"), { encoding: "utf8" })
    ).resolves.toMatchSnapshot();
    await expect(
      readFile(join(dir, ".env"), { encoding: "utf8" })
    ).resolves.toMatchSnapshot();
  });
});
