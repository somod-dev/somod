import { mockedFunction } from "../../../utils";
import {
  IContext,
  IServerlessTemplateHandler,
  JSONObjectNode
} from "somod-types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import { checkAccess } from "../../../../src/utils/serverless/keywords/access";
import {
  Extend,
  keywordExtend
} from "../../../../src/utils/serverless/keywords/extend";

jest.mock("../../../../src/utils/serverless/keywords/access", () => {
  return {
    __esModule: true,
    checkAccess: jest.fn().mockResolvedValue([])
  };
});

describe("Test extend keyword", () => {
  beforeEach(() => {
    mockedFunction(checkAccess).mockReset();
  });

  test("the keyword name", () => {
    expect(keywordExtend.keyword).toEqual("SOMOD::Extend");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await keywordExtend.getValidator("m1", null);

    const obj = {
      [keywordExtend.keyword]: {}
    };

    expect(
      validator(
        keywordExtend.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordExtend.keyword] as { module: string; resource: string }
      )
    ).toEqual([
      new Error("SOMOD::Extend is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await keywordExtend.getValidator("m1", null);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          Properties: {
            [keywordExtend.keyword]: {}
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual([
      new Error("SOMOD::Extend is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword as a Resource Property", async () => {
    const resources = {
      m0: {
        MyResource1: {
          resource: {
            Type: "Custom::MyCustomType",
            [keywordExtend.keyword]: { module: "m1", resource: "r1" },
            Properties: {}
          }
        }
      },
      m1: {
        r1: { resource: { Type: "Custom::MyCustomType", Properties: {} } }
      }
    };
    const validator = await keywordExtend.getValidator("m0", {
      serverlessTemplateHandler: {
        getResource: (m, r) => {
          return resources[m][r];
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const objNode = parseJson({
      Resources: { MyResource1: resources.m0.MyResource1.resource }
    }) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        resources.m0.MyResource1.resource[keywordExtend.keyword] as Extend
      )
    ).toEqual([]);
  });

  test("the validator with extending resource in same module", async () => {
    const resources = {
      m0: {
        MyResource1: {
          resource: {
            Type: "Custom::MyCustomType",
            [keywordExtend.keyword]: { module: "m0", resource: "MyResource2" },
            Properties: {}
          }
        },
        MyResource2: {
          resource: {
            Type: "Custom::MyCustomType",
            Properties: {}
          }
        }
      }
    };

    const validator = await keywordExtend.getValidator("m0", {
      serverlessTemplateHandler: {
        getResource: (m, r) => {
          return resources[m][r];
        }
      } as IServerlessTemplateHandler
    } as IContext);

    const objNode = parseJson({
      Resources: { MyResource1: resources.m0.MyResource1.resource }
    }) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        resources.m0.MyResource1.resource[keywordExtend.keyword] as Extend
      )
    ).toEqual([
      new Error(
        "Can not extend the resource MyResource2 in the same module m0. Edit the resource directly"
      )
    ]);
  });

  test("the validator with extending different type of resource", async () => {
    const resources = {
      m0: {
        MyResource1: {
          resource: {
            Type: "Custom::MyCustomType",
            [keywordExtend.keyword]: { module: "m1", resource: "r1" },
            Properties: {}
          }
        }
      },
      m1: {
        r1: { resource: { Type: "AnotherType", Properties: {} } }
      }
    };

    const validator = await keywordExtend.getValidator("m0", {
      serverlessTemplateHandler: { getResource: (m, r) => resources[m][r] }
    } as IContext);

    const objNode = parseJson({
      Resources: { MyResource1: resources.m0.MyResource1.resource }
    }) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        resources.m0.MyResource1.resource[keywordExtend.keyword] as Extend
      )
    ).toEqual([
      new Error(
        "Can extend only same type of resource. Custom::MyCustomType can not extend AnotherType"
      )
    ]);
  });

  test("the validator calling checkAccess for extended resource", async () => {
    const resources = {
      m0: {
        MyResource1: {
          resource: {
            Type: "Custom::MyCustomType",
            [keywordExtend.keyword]: { module: "m1", resource: "r1" },
            Properties: {}
          }
        }
      },
      m1: {
        r1: { resource: { Type: "Custom::MyCustomType", Properties: {} } }
      }
    };

    const validator = await keywordExtend.getValidator("m0", {
      serverlessTemplateHandler: { getResource: (m, r) => resources[m][r] }
    } as IContext);

    const objNode = parseJson({
      Resources: { MyResource1: resources.m0.MyResource1.resource }
    }) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        resources.m0.MyResource1.resource[keywordExtend.keyword] as Extend
      )
    ).toEqual([]);

    expect(checkAccess).toHaveBeenCalledTimes(1);
    expect(checkAccess).toHaveBeenNthCalledWith(
      1,
      resources.m1.r1.resource,
      "m1",
      "r1",
      "m0",
      "Extended"
    );
  });

  test("the validator piping the checkAccess errors", async () => {
    mockedFunction(checkAccess).mockImplementation(() => {
      throw new Error("Error from checkAccess");
    });

    const resources = {
      m0: {
        MyResource1: {
          resource: {
            Type: "Custom::MyCustomType",
            [keywordExtend.keyword]: { module: "m1", resource: "r1" },
            Properties: {}
          }
        }
      },
      m1: {
        r1: { resource: { Type: "Custom::MyCustomType", Properties: {} } }
      }
    };

    const validator = await keywordExtend.getValidator("m0", {
      serverlessTemplateHandler: { getResource: (m, r) => resources[m][r] }
    } as IContext);

    const objNode = parseJson({
      Resources: { MyResource1: resources.m0.MyResource1.resource }
    }) as JSONObjectNode;

    expect(
      validator(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        resources.m0.MyResource1.resource[keywordExtend.keyword] as Extend
      )
    ).toEqual([new Error("Error from checkAccess")]);
  });

  test("the processor", async () => {
    const processor = await keywordExtend.getProcessor("m0", null);

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordExtend.keyword]: { module: "m1", resource: "r1" },
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      processor(
        keywordExtend.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordExtend.keyword] as {
          module: string;
          resource: string;
        }
      )
    ).toEqual({
      type: "object",
      value: undefined
    });
  });
});
