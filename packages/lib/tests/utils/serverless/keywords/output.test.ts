import { JSONObjectNode } from "somod-types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import {
  checkOutput,
  keywordOutput
} from "../../../../src/utils/serverless/keywords/output";

type OutputType = {
  default: boolean;
  attributes: string[];
};

describe("Test output keyword", () => {
  const getValidator = () => keywordOutput.getValidator("", null);
  const getProcessor = () => keywordOutput.getProcessor("", null);

  test("the keyword name", () => {
    expect(keywordOutput.keyword).toEqual("SOMOD::Output");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordOutput.keyword]: {}
    };

    expect(
      validator(
        keywordOutput.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordOutput.keyword] as unknown as OutputType
      )
    ).toEqual([
      new Error("SOMOD::Output is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await getValidator();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          Properties: {
            [keywordOutput.keyword]: {}
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordOutput.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[
          keywordOutput.keyword
        ] as unknown as OutputType
      )
    ).toEqual([
      new Error("SOMOD::Output is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword as a Resource Property", async () => {
    const validator = await getValidator();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordOutput.keyword]: { default: true, attributes: ["Arn"] },
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordOutput.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[
          keywordOutput.keyword
        ] as unknown as OutputType
      )
    ).toEqual([]);
  });

  test("the processor", async () => {
    const processor = await getProcessor();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordOutput.keyword]: { default: true, attributes: ["Arn"] },
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      processor(
        keywordOutput.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordOutput.keyword] as OutputType
      )
    ).toEqual({ type: "keyword", value: {} });
  });
});

describe("Test util checkOutput from output keyword for", () => {
  const usecases: [
    string,
    string | undefined,
    OutputType | undefined,
    Error | undefined
  ][] = [
    // no keyword
    [
      "expecting default with out keyword",
      undefined,
      null,
      new Error(
        "default must be true in SOMOD::Output of MyResource1 resource in @s1/m1."
      )
    ],
    [
      "expecting attribute with out keyword",
      "x",
      null,
      new Error(
        "attributes must have x in SOMOD::Output of MyResource1 resource in @s1/m1."
      )
    ],

    // default = false
    [
      "expecting default with default = false",
      undefined,
      { default: false, attributes: [] },
      new Error(
        "default must be true in SOMOD::Output of MyResource1 resource in @s1/m1."
      )
    ],
    [
      "expecting default with default = true",
      undefined,
      { default: true, attributes: [] },
      undefined
    ],

    // attributes
    [
      "expecting non existing attribute",
      "x",
      { default: false, attributes: ["y"] },
      new Error(
        "attributes must have x in SOMOD::Output of MyResource1 resource in @s1/m1."
      )
    ],
    [
      "expecting existing attribute",
      "x",
      { default: false, attributes: ["x", "y"] },
      undefined
    ]
  ];

  test.each(usecases)(
    "%s",
    async (title, attribute, outputValue, expectedError) => {
      const resource = { Type: "", Properties: {} };
      if (outputValue) {
        resource[keywordOutput.keyword] = outputValue;
      }
      let error = undefined;
      try {
        checkOutput(resource, "@s1/m1", "MyResource1", attribute);
      } catch (e) {
        error = e;
      }
      expect(error).toEqual(expectedError);
    }
  );
});
