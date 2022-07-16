import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { dump } from "js-yaml";
import { generateSamConfigParameterOverrides } from "../../../src/utils/serverless/parameter";

describe("test util serverless.generateSamConfigParameterOverrides", () => {
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
        somod: "1.0.0"
      }),
      "serverless/template.yaml": dump({
        Resources: {
          MyLambda: {
            Type: "AWS::Serverless::Function",
            Properties: {
              InlineCode: "dummy",
              Environmental: {
                Variables: {
                  MY_VAR1: {
                    "SOMOD::Parameter": "p1.string"
                  },
                  MY_VAR2: {
                    "SOMOD::Parameter": "p1.integer"
                  },
                  MY_VAR3: {
                    "SOMOD::Parameter": "p1.number"
                  },
                  MY_VAR4: {
                    "SOMOD::Parameter": "p2.boolean"
                  },
                  MY_VAR5: {
                    "SOMOD::Parameter": "p2.null"
                  },
                  MY_VAR6: {
                    "SOMOD::Parameter": "p3.array"
                  },
                  MY_VAR7: {
                    "SOMOD::Parameter": "p3.object.content"
                  }
                }
              }
            }
          }
        }
      }),
      "parameters.json": JSON.stringify({
        "p1.string": "this is a string",
        "p1.integer": 123,
        "p1.number": 100.02,
        "p2.boolean": true,
        "p2.null": null,
        "p3.array": ["this is a string", 123, 100.02, true, null],
        "p3.object.content": {
          string: 'this is a string conatining quotes (")',
          integer: 123,
          number: 100.02,
          boolean: false,
          null: null,
          array: ["this is a string", 123, 100.02, true, null],
          object: {}
        }
      })
    });

    await expect(
      generateSamConfigParameterOverrides(dir, ["somod"])
    ).resolves.toEqual({
      p1: '{"string":"this is a string","integer":123,"number":100.02}',
      p2: '{"boolean":true,"null":null}',
      p3: '{"array":["this is a string",123,100.02,true,null],"object.content":{"string":"this is a string conatining quotes (\\")","integer":123,"number":100.02,"boolean":false,"null":null,"array":["this is a string",123,100.02,true,null],"object":{}}}'
    });
  });
});
