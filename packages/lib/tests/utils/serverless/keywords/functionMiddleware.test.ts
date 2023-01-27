import { existsSync } from "fs";
import { listFiles } from "nodejs-file-utils";
import { join } from "path";
import { IContext, JSONObjectNode } from "somod-types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { keywordFunctionMiddleware } from "../../../../src/utils/serverless/keywords/functionMiddleware";
import { mockedFunction } from "../../../utils";

jest.mock("nodejs-file-utils", () => {
  const original = jest.requireActual("nodejs-file-utils");
  return {
    __esModule: true,
    ...original,
    listFiles: jest.fn()
  };
});

jest.mock("fs", () => {
  const original = jest.requireActual("fs");
  return {
    __esModule: true,
    ...original,
    existsSync: jest.fn()
  };
});

describe("Test functionMiddleware keyword", () => {
  beforeEach(() => {
    mockedFunction(listFiles).mockReset();
    mockedFunction(listFiles).mockResolvedValue(["mw1.ts", "mw2.ts", "mw3.ts"]);

    mockedFunction(existsSync).mockReset();
    mockedFunction(existsSync).mockReturnValue(true);
  });

  test("the keyword name", () => {
    expect(keywordFunctionMiddleware.keyword).toEqual(
      "SOMOD::FunctionMiddleware"
    );
  });

  test("the validator with keyword at top object", async () => {
    const validator = await keywordFunctionMiddleware.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      [keywordFunctionMiddleware.keyword]: { name: "" }
    };

    expect(
      validator(
        keywordFunctionMiddleware.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordFunctionMiddleware.keyword]
      )
    ).toEqual([
      new Error(
        "SOMOD::FunctionMiddleware is allowed only as value of CodeUri property of SOMOD::Serverless::FunctionMiddleware resource"
      )
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await keywordFunctionMiddleware.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          Properties: {
            [keywordFunctionMiddleware.keyword]: { name: "" }
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunctionMiddleware.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[keywordFunctionMiddleware.keyword]
      )
    ).toEqual([
      new Error(
        "SOMOD::FunctionMiddleware is allowed only as value of CodeUri property of SOMOD::Serverless::FunctionMiddleware resource"
      )
    ]);
  });

  test("the validator with keyword at CodeUri Property", async () => {
    const validator = await keywordFunctionMiddleware.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          Properties: {
            CodeUri: {
              [keywordFunctionMiddleware.keyword]: { name: "mw1" }
            }
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunctionMiddleware.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.CodeUri[
          keywordFunctionMiddleware.keyword
        ]
      )
    ).toEqual([]);
  });

  test("the validator with non existing function middleware", async () => {
    const validator = await keywordFunctionMiddleware.getValidator("m1", {
      dir: ""
    } as IContext);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "SOMOD::Serverless::FunctionMiddleware",
          Properties: {
            CodeUri: {
              [keywordFunctionMiddleware.keyword]: { name: "middleware1" }
            }
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordFunctionMiddleware.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties.CodeUri[
          keywordFunctionMiddleware.keyword
        ]
      )
    ).toEqual([
      new Error(
        "Function Middleware middleware1 not found. Create the middleware under serverless/functions/middlewares directory"
      )
    ]);
  });

  test("the getValidator is calling existsSync and skipping listFiles when existsSync returns false", async () => {
    mockedFunction(existsSync).mockReturnValue(false);
    await keywordFunctionMiddleware.getValidator("m1", {
      dir: "/root/dir"
    } as IContext);
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(existsSync).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "serverless/functions/middlewares")
    );
    expect(listFiles).toHaveBeenCalledTimes(0);
  });

  test("the getValidator is calling listFiles", async () => {
    await keywordFunctionMiddleware.getValidator("m1", {
      dir: "/root/dir"
    } as IContext);
    expect(listFiles).toHaveBeenCalledTimes(1);
    expect(listFiles).toHaveBeenNthCalledWith(
      1,
      join("/root/dir", "serverless/functions/middlewares")
    );
  });

  test("the processor", async () => {
    const allModules = {
      m1: {
        moduleName: "m1",
        location: "/a/b/c",
        path: "serverless/template.yaml",
        json: {
          Resources: {
            MyResource1: {
              Type: "SOMOD::Serverless::FunctionMiddleware",
              Properties: {
                CodeUri: {
                  [keywordFunctionMiddleware.keyword]: { name: "mw1" }
                }
              }
            }
          }
        }
      }
    };

    const processor = await keywordFunctionMiddleware.getProcessor("m1", {
      dir: "/root/dir"
    } as IContext);

    const objNode = parseJson(allModules.m1.json) as JSONObjectNode;

    expect(
      processor(
        keywordFunctionMiddleware.keyword,
        (
          (
            (objNode.properties["Resources"] as JSONObjectNode).properties[
              "MyResource1"
            ] as JSONObjectNode
          ).properties["Properties"] as JSONObjectNode
        ).properties["CodeUri"] as JSONObjectNode,
        allModules.m1.json.Resources.MyResource1.Properties.CodeUri[
          keywordFunctionMiddleware.keyword
        ]
      )
    ).toEqual({
      type: "object",
      value: undefined,
      level: 2
    });
  });
});
