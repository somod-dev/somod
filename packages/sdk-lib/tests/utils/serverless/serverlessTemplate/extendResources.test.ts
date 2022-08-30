import { keywordExtend } from "../../../../src/utils/serverless/keywords/extend";
import { extendResources } from "../../../../src/utils/serverless/serverlessTemplate/extendResources";
import { SAMTemplate } from "../../../../src/utils/serverless/types";

describe("test util serverlessTemplate.extendResources", () => {
  test("usecase 1", () => {
    const samTemplate: SAMTemplate = {
      Resources: {
        A: {
          Type: "MyType",
          Properties: { P: "a", PA: ["a"] }
        },
        D: {
          Type: "MyType",
          [keywordExtend.keyword]: "B",
          Properties: { P: "d", PA: ["d"] }
        },
        B: {
          Type: "MyType",
          [keywordExtend.keyword]: "A",
          Properties: { P: "b", PA: ["b"] }
        },
        C: {
          Type: "MyType",
          [keywordExtend.keyword]: "B",
          Properties: { P: "c", PA: ["c"] }
        },
        F: {
          Type: "MyType",
          [keywordExtend.keyword]: "E",
          Properties: { P: "f", PA: ["f"] }
        },
        E: {
          Type: "MyType",
          [keywordExtend.keyword]: "D",
          Properties: { P: "e", PA: ["e"] }
        }
      }
    };

    expect(extendResources(samTemplate)).toBeUndefined();

    expect(samTemplate).toEqual({
      Resources: {
        A: {
          Type: "MyType",
          Properties: { P: "c", PA: ["c"] }
        }
      }
    });
  });

  test("usecase 2", () => {
    const samTemplate: SAMTemplate = {
      Resources: {
        A: {
          Type: "MyType",
          Properties: { P: "a", PA: ["a"] }
        },
        D: {
          Type: "MyType",
          [keywordExtend.keyword]: "B",
          Properties: { P: "d", PA: ["d"] }
        },
        B: {
          Type: "MyType",
          [keywordExtend.keyword]: "A",
          Properties: { P: "b", PA: ["b"] }
        },
        C: {
          Type: "MyType",
          [keywordExtend.keyword]: "B",
          Properties: { P: "c", PA: ["c"] }
        },
        F: {
          Type: "MyType",
          [keywordExtend.keyword]: "E",
          Properties: { P: "f", PA: ["f"] }
        },
        E: {
          Type: "MyType",
          [keywordExtend.keyword]: "C",
          Properties: { P: "e", PA: ["e"] }
        }
      }
    };

    expect(extendResources(samTemplate)).toBeUndefined();

    expect(samTemplate).toEqual({
      Resources: {
        A: {
          Type: "MyType",
          Properties: { P: "f", PA: ["f"] }
        }
      }
    });
  });
});
