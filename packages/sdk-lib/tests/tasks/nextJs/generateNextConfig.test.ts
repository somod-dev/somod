import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { unixStylePath } from "@solib/cli-base";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join, relative } from "path";
import { generateNextConfig } from "../../../src";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { Config, loadConfigNamespaces } from "../../../src/utils/nextJs/config";
import { loadParameterNamespaces } from "../../../src/utils/parameters/namespace";

describe("test Task generateNextConfig", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir();
    ModuleHandler.initialize(dir, [
      loadConfigNamespaces,
      loadParameterNamespaces
    ]);
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("test", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "parameters.json": JSON.stringify({
        "m1.p1": null,
        "m1.p2": 1,
        "m2.p1": "this.is.string",
        "m2.p2": true,
        "m2.p3": false,
        "m3.p1": { m3: "p1" },
        "m3.p2": ["m3p2"],
        "m3.p3": ["m3", "p3"],
        "m3.p4": "m3p4"
      }),
      "ui/config.yaml": dump({
        env: {
          MY_ENV1: { "SOMOD::Parameter": "m1.p1" },
          MY_ENV2: { "SOMOD::Parameter": "m1.p2" },
          MY_ENV3: { "SOMOD::Parameter": "m2.p1" },
          MY_ENV4: { "SOMOD::Parameter": "m2.p2" }
        },
        imageDomains: ["sodaru.com", { "SOMOD::Parameter": "m2.p1" }],
        publicRuntimeConfig: {
          prc1: { "SOMOD::Parameter": "m2.p2" },
          prc2: { "SOMOD::Parameter": "m2.p3" },
          prc3: { "SOMOD::Parameter": "m3.p1" }
        },
        serverRuntimeConfig: {
          src1: { "SOMOD::Parameter": "m3.p2" },
          src2: { "SOMOD::Parameter": "m3.p3" },
          src3: { "SOMOD::Parameter": "m3.p4" }
        }
      } as Config)
    });

    await expect(generateNextConfig(dir)).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, ".env"), { encoding: "utf8" })
    ).resolves.toEqual(
      `MY_ENV1=null
MY_ENV2=1
MY_ENV3="this.is.string"
MY_ENV4=true`
    );

    await expect(readFile(join(dir, "next.config.js"), { encoding: "utf8" }))
      .resolves.toEqual(`/* eslint-disable */

const config = {
  images: {
    domains: ["sodaru.com", "this.is.string"]
  },
  publicRuntimeConfig: {"prc1":true,"prc2":false,"prc3":{"m3":"p1"}},
  serverRuntimeConfig: {"src1":["m3p2"],"src2":["m3","p3"],"src3":"m3p4"}
};

const withNextConfigOverride = require("${unixStylePath(
      relative(
        dir,
        join(__dirname, "../../../src/tasks/scripts/withNextConfigOverride.js")
      )
    )}");

module.exports = withNextConfigOverride(__dirname, config);
`);
  });
});
