import { JSONObjectNode, parseJson } from "../../../../src/utils/jsonTemplate";
import { keywordRef } from "../../../../src/utils/serverless-new/keywords/ref";
import { checkOutput } from "../../../../src/utils/serverless-new/keywords/output";
import { checkAccess } from "../../../../src/utils/serverless-new/keywords/access";
import { checkCustomResourceSchema } from "../../../../src/utils/serverless-new/keywords/function";
import { mockedFunction } from "@sodev/test-utils";

jest.mock("../../../../src/utils/serverless-new/keywords/output", () => {
  return {
    __esModule: true,
    checkOutput: jest.fn().mockReturnValue([])
  };
});

jest.mock("../../../../src/utils/serverless-new/keywords/access", () => {
  return {
    __esModule: true,
    checkAccess: jest.fn().mockReturnValue([])
  };
});

jest.mock("../../../../src/utils/serverless-new/keywords/function", () => {
  return {
    __esModule: true,
    checkCustomResourceSchema: jest.fn().mockReturnValue([])
  };
});

type RefType = {
  module?: string;
  resource: string;
  attribute?: string;
};

describe("Test ref keyword", () => {
  const allModules = {
    m1: {
      moduleName: "m1",
      location: "",
      path: "",
      json: {
        Resources: {
          TargetResource: {
            Type: "MyResourceType",
            Properties: {}
          }
        }
      }
    }
  };
  const getValidator = (currentModule = "m1") =>
    keywordRef.getValidator("", currentModule, allModules);
  const getProcessor = () => keywordRef.getProcessor("", "m1", {});

  beforeEach(() => {
    mockedFunction(checkAccess).mockReset();
    mockedFunction(checkAccess).mockReturnValue([]);
    mockedFunction(checkOutput).mockReset();
    mockedFunction(checkOutput).mockReturnValue([]);
    mockedFunction(checkCustomResourceSchema).mockReset();
    mockedFunction(checkCustomResourceSchema).mockReturnValue([]);
  });

  test("the keyword name", () => {
    expect(keywordRef.keyword).toEqual("SOMOD::Ref");
  });

  test("the validator with additional properties", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: { resource: "TargetResource" },
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as RefType
      )
    ).toEqual([
      new Error("Object with SOMOD::Ref must not have additional properties")
    ]);
  });

  test("the validator with valid value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: { resource: "TargetResource" } as RefType
    };

    expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword]
      )
    ).toEqual([]);
  });

  test("the validator with invalid value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: { join: ["Target", "Resource"] },
        m: "m1"
      }
    };

    expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as unknown as RefType
      )
    ).toEqual([
      new Error(
        "Has following errors\nmust NOT have additional properties\nresource must be string"
      )
    ]);
  });

  test("the validator with non existing reference", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: "TargetResource2"
      }
    };

    expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as unknown as RefType
      )
    ).toEqual([
      new Error("Referenced module resource {m1, TargetResource2} not found.")
    ]);
  });

  test("the validator with non existing reference in another module", async () => {
    const validator = await getValidator("m2");

    const obj = {
      [keywordRef.keyword]: {
        resource: "TargetResource2",
        module: "m1"
      }
    };

    expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as unknown as RefType
      )
    ).toEqual([
      new Error("Referenced module resource {m1, TargetResource2} not found.")
    ]);
  });

  test("the validator calling check access, check output and checkCustomResourceSchema", async () => {
    mockedFunction(checkAccess).mockReturnValue([
      new Error("error from checkAccess")
    ]);
    mockedFunction(checkOutput).mockReturnValue([
      new Error("error from checkOutput")
    ]);
    mockedFunction(checkCustomResourceSchema).mockReturnValue([
      new Error("error from checkCustomResourceSchema")
    ]);

    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: "TargetResource"
      }
    };

    const node = parseJson(obj) as JSONObjectNode;

    expect(
      validator(keywordRef.keyword, node, obj[keywordRef.keyword])
    ).toEqual([
      new Error("error from checkAccess"),
      new Error("error from checkOutput"),
      new Error("error from checkCustomResourceSchema")
    ]);

    expect(checkAccess).toHaveBeenCalledTimes(1);
    expect(checkAccess).toHaveBeenNthCalledWith(
      1,
      "m1",
      allModules.m1,
      "TargetResource"
    );
    expect(checkOutput).toHaveBeenCalledTimes(1);
    expect(checkOutput).toHaveBeenNthCalledWith(
      1,
      allModules.m1,
      "TargetResource",
      undefined
    );
    expect(checkCustomResourceSchema).toHaveBeenCalledTimes(1);
    expect(checkCustomResourceSchema).toHaveBeenNthCalledWith(
      1,
      node,
      allModules.m1,
      "TargetResource"
    );
  });

  test("the processor without attribute", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordRef.keyword]: { resource: "TargetResource" }
    };

    expect(
      processor(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword]
      )
    ).toEqual({
      type: "object",
      value: {
        Ref: "rca0df2c9TargetResource"
      }
    });
  });

  test("the processor with attribute", async () => {
    const processor = await getProcessor();

    const obj = {
      [keywordRef.keyword]: { resource: "TargetResource", attribute: "a1" }
    };

    expect(
      processor(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword]
      )
    ).toEqual({
      type: "object",
      value: {
        "Fn::GetAtt": ["rca0df2c9TargetResource", "a1"]
      }
    });
  });
});
