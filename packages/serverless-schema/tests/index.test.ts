/* eslint-disable no-console */
import Ajv from "ajv";
import { compile } from "../src";
import addFormats from "ajv-formats";
import { dirname, join } from "path";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { sync as rimrafSync } from "rimraf";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  stat,
  writeFile
} from "fs/promises";

const copyDir = async (source: string, dest: string): Promise<void> => {
  const dirsToCopy: string[] = ["."];
  while (dirsToCopy.length > 0) {
    const dirToCopy = dirsToCopy.shift();
    const files = await readdir(join(source, dirToCopy));
    await Promise.all(
      files.map(async file => {
        const stats = await stat(join(source, dirToCopy, file));
        if (stats.isDirectory()) {
          dirsToCopy.push(join(dirToCopy, file));
        } else {
          const destFile = join(dest, dirToCopy, file);
          const destDir = dirname(destFile);
          await mkdir(destDir, { recursive: true });
          await copyFile(join(source, dirToCopy, file), destFile);
        }
      })
    );
  }
};

describe("Test compile", () => {
  const warn = console.warn;

  const knownWarnings = [
    'strict mode: "items" is 2-tuple, but minItems or maxItems/additionalItems are not specified or different at path "#/properties/required"'
  ];

  beforeEach(() => {
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.warn = warn;
  });

  test("default schema will load successfully", async () => {
    const ajv = new Ajv();
    addFormats(ajv);
    const validate = await compile(join(__dirname, ".."), ajv);
    expect(validate.errors).toBeNull();
    knownWarnings.forEach((warning, i) => {
      expect(console.warn).toHaveBeenNthCalledWith(i + 1, warning);
    });
  });

  test("private scope schema will load successfully", async () => {
    const ajv = new Ajv();
    addFormats(ajv);
    const dir = mkdtempSync(join(tmpdir(), "serverless-schema-test-"));
    try {
      // Stage Setup -- START
      const thisPackage = join(__dirname, "..");
      const thisPackageInTempDir = join(
        dir,
        "node_modules/@somod/serverless-schema"
      );
      await copyDir(
        join(thisPackage, "meta-schemas"),
        join(thisPackageInTempDir, "meta-schemas")
      );
      await copyDir(
        join(thisPackage, "schemas"),
        join(thisPackageInTempDir, "schemas")
      );

      await writeFile(
        join(dir, "package.json"),
        JSON.stringify({
          name: "@somod/test-scope-in-serverless-schema",
          version: "1.0.0",
          serverlessSchema:
            "https://json-schema.sodaru.com/@somod/test-scope-in-serverless-schema/test-scope.json"
        })
      );

      const samplePrivateScopeSchema = await readFile(
        join(__dirname, "test-scope.json"),
        { encoding: "utf8" }
      );
      const correctedSamplePrivateScopeSchema =
        samplePrivateScopeSchema.replace(/__/g, "");
      await writeFile(
        join(dir, "test-scope.json"),
        correctedSamplePrivateScopeSchema
      );

      const samplePrivateScopeResource = await readFile(
        join(__dirname, "ssm-parameter.json"),
        { encoding: "utf8" }
      );

      const correctedSamplePrivateScopeResource =
        samplePrivateScopeResource.replace(/__/g, "");

      await writeFile(
        join(dir, "ssm-parameter.json"),
        correctedSamplePrivateScopeResource
      );

      // Stage Setup -- END

      const validate = await compile(dir, ajv);
      expect(validate.errors).toBeNull();
    } finally {
      rimrafSync(dir);
    }
  });
});
