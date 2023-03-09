import { createFiles, createTempDir, deleteDir } from "../../../utils";
import { dump } from "js-yaml";
import { build } from "../../../../src/utils/serverless/serverlessTemplate/build";
import { readFile } from "fs/promises";
import { join } from "path";
import { ServerlessTemplate } from "somod-types";

describe("test util serverlessTemplate.build", () => {
  let dir: string;

  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("successfully builds", async () => {
    const serverlessTemplate: ServerlessTemplate = {
      Resources: {
        R1: {
          Type: "T1",
          Properties: {}
        },
        R2: {
          Type: "T2",
          Properties: { P1: "", P2: true }
        },
        R3: {
          Type: "T1",
          Properties: { P1: "", P2: true }
        }
      }
    };
    createFiles(dir, {
      "serverless/template.yaml": dump(serverlessTemplate)
    });

    await expect(build(dir)).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, "build/serverless/template.json"), "utf8")
    ).resolves.toEqual(JSON.stringify(serverlessTemplate));
  });
});
