import { parseJson } from "../../../../src/utils/jsonTemplate";
import { keywordRef } from "../../../../src/utils/serverless/keywords/ref";
import { checkOutput } from "../../../../src/utils/serverless/keywords/output";
import { checkAccess } from "../../../../src/utils/serverless/keywords/access";
import { checkCustomResourceSchema } from "../../../../src/utils/serverless/keywords/function";
import { mockedFunction } from "../../../utils";
import { keywordExtend } from "../../../../src/utils/serverless/keywords/extend";
import {
  IContext,
  IServerlessTemplateHandler,
  JSONObjectNode
} from "somod-types";

jest.mock("../../../../src/utils/serverless/keywords/output", () => {
  return {
    __esModule: true,
    checkOutput: jest.fn().mockReturnValue([])
  };
});

jest.mock("../../../../src/utils/serverless/keywords/access", () => {
  return {
    __esModule: true,
    checkAccess: jest.fn().mockReturnValue([])
  };
});

jest.mock("../../../../src/utils/serverless/keywords/function", () => {
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
  const template = {
    Resources: {
      TargetResource: {
        Type: "MyResourceType",
        Properties: {}
      },
      ExtendedTargetResource: {
        Type: "MyResourceType",
        [keywordExtend.keyword]: {
          resource: "TargetResource"
        },
        Properties: {}
      }
    }
  };
  const getValidator = (currentModule = "m1") =>
    keywordRef.getValidator(currentModule, {
      serverlessTemplateHandler: {
        getResource: (m, r) =>
          template.Resources[r]
            ? {
                resource: template.Resources[r],
                propertySourceMap: { module: m, resource: r, children: {} }
              }
            : null
      } as IServerlessTemplateHandler
    } as IContext);
  const getProcessor = () =>
    keywordRef.getProcessor("m1", {
      serverlessTemplateHandler: {
        getSAMResourceLogicalId: (m, r) => `${m}/${r}`
      } as IServerlessTemplateHandler
    } as IContext);

  beforeEach(() => {
    mockedFunction(checkAccess).mockReset();
    mockedFunction(checkOutput).mockReset();
    mockedFunction(checkCustomResourceSchema).mockReset();
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

    await expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as RefType
      )
    ).resolves.toEqual([
      new Error("Object with SOMOD::Ref must not have additional properties")
    ]);
  });

  test("the validator with valid value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: { resource: "TargetResource" } as RefType
    };

    await expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword]
      )
    ).resolves.toEqual([]);
  });

  test("the validator with invalid value", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: { join: ["Target", "Resource"] },
        m: "m1"
      }
    };

    await expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as unknown as RefType
      )
    ).resolves.toEqual([
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

    await expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as unknown as RefType
      )
    ).resolves.toEqual([
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

    await expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as unknown as RefType
      )
    ).resolves.toEqual([
      new Error("Referenced module resource {m1, TargetResource2} not found.")
    ]);
  });

  test("the validator with reference to extended resource", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: "ExtendedTargetResource"
      }
    };

    await expect(
      validator(
        keywordRef.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordRef.keyword] as unknown as RefType
      )
    ).resolves.toEqual([]);
  });

  test("the validator calling check access", async () => {
    mockedFunction(checkAccess).mockImplementation(() => {
      throw new Error("error from checkAccess");
    });

    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: "TargetResource"
      }
    };

    const node = parseJson(obj) as JSONObjectNode;

    await expect(
      validator(keywordRef.keyword, node, obj[keywordRef.keyword])
    ).resolves.toEqual([new Error("error from checkAccess")]);

    expect(checkAccess).toHaveBeenCalledTimes(1);
    expect(checkAccess).toHaveBeenNthCalledWith(
      1,
      template.Resources.TargetResource,
      "m1",
      "TargetResource",
      "m1"
    );
    expect(checkOutput).toHaveBeenCalledTimes(0);
    expect(checkCustomResourceSchema).toHaveBeenCalledTimes(0);
  });

  test("the validator calling check output", async () => {
    mockedFunction(checkOutput).mockImplementation(() => {
      throw new Error("error from checkOutput");
    });

    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: "TargetResource"
      }
    };

    const node = parseJson(obj) as JSONObjectNode;

    await expect(
      validator(keywordRef.keyword, node, obj[keywordRef.keyword])
    ).resolves.toEqual([new Error("error from checkOutput")]);

    expect(checkAccess).toHaveBeenCalledTimes(1);
    expect(checkAccess).toHaveBeenNthCalledWith(
      1,
      template.Resources.TargetResource,
      "m1",
      "TargetResource",
      "m1"
    );
    expect(checkOutput).toHaveBeenCalledTimes(1);
    expect(checkOutput).toHaveBeenNthCalledWith(
      1,
      template.Resources.TargetResource,
      "m1",
      "TargetResource",
      undefined
    );
    expect(checkCustomResourceSchema).toHaveBeenCalledTimes(0);
  });

  test("the validator calling checkCustomResourceSchema", async () => {
    mockedFunction(checkCustomResourceSchema).mockImplementation(() => {
      throw new Error("error from checkCustomResourceSchema");
    });

    const validator = await getValidator();

    const obj = {
      [keywordRef.keyword]: {
        resource: "TargetResource"
      }
    };

    const node = parseJson(obj) as JSONObjectNode;

    await expect(
      validator(keywordRef.keyword, node, obj[keywordRef.keyword])
    ).resolves.toEqual([new Error("error from checkCustomResourceSchema")]);

    expect(checkAccess).toHaveBeenCalledTimes(1);
    expect(checkAccess).toHaveBeenNthCalledWith(
      1,
      template.Resources.TargetResource,
      "m1",
      "TargetResource",
      "m1"
    );
    expect(checkOutput).toHaveBeenCalledTimes(1);
    expect(checkOutput).toHaveBeenNthCalledWith(
      1,
      template.Resources.TargetResource,
      "m1",
      "TargetResource",
      undefined
    );
    expect(checkCustomResourceSchema).toHaveBeenCalledTimes(1);
    expect(checkCustomResourceSchema).toHaveBeenNthCalledWith(
      1,
      template.Resources.TargetResource,
      node
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
        Ref: "m1/TargetResource"
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
        "Fn::GetAtt": ["m1/TargetResource", "a1"]
      }
    });
  });
});
