import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { dump } from "js-yaml";
import { join } from "path";
import { generateNextConfig } from "../../../src";
import { Config } from "../../../src/utils/nextJs/config";

describe("test Task generateNextConfig", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("test", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "my-module",
        version: "1.0.0",
        njp: "1.0.0"
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
          MY_ENV1: { "NJP::Parameter": "m1.p1" },
          MY_ENV2: { "NJP::Parameter": "m1.p2" },
          MY_ENV3: { "NJP::Parameter": "m2.p1" },
          MY_ENV4: { "NJP::Parameter": "m2.p2" }
        },
        imageDomains: ["sodaru.com", { "NJP::Parameter": "m2.p1" }],
        publicRuntimeConfig: {
          prc1: { "NJP::Parameter": "m2.p2" },
          prc2: { "NJP::Parameter": "m2.p3" },
          prc3: { "NJP::Parameter": "m3.p1" }
        },
        serverRuntimeConfig: {
          src1: { "NJP::Parameter": "m3.p2" },
          src2: { "NJP::Parameter": "m3.p3" },
          src3: { "NJP::Parameter": "m3.p4" }
        }
      } as Config)
    });

    await expect(generateNextConfig(dir, ["njp"])).resolves.toBeUndefined();

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

module.exports = {
  images: {
    domains: ["sodaru.com", "this.is.string"]
  },
  publicRuntimeConfig: {"prc1":true,"prc2":false,"prc3":{"m3":"p1"}},
  serverRuntimeConfig: {"src1":["m3p2"],"src2":["m3","p3"],"src3":"m3p4"}
};
`);
  });
});
