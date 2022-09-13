import { JSONObjectNode } from "somod-types";
import { parseJson } from "../../../../src/utils/jsonTemplate";
import {
  checkAccess,
  keywordAccess
} from "../../../../src/utils/serverless/keywords/access";

describe("Test access keyword", () => {
  const getValidator = () => keywordAccess.getValidator("", "", {});
  const getProcessor = () => keywordAccess.getProcessor("", "", {});

  test("the keyword name", () => {
    expect(keywordAccess.keyword).toEqual("SOMOD::Access");
  });

  test("the validator with keyword at top object", async () => {
    const validator = await getValidator();

    const obj = {
      [keywordAccess.keyword]: {}
    };

    expect(
      validator(
        keywordAccess.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordAccess.keyword] as unknown as "module"
      )
    ).toEqual([
      new Error("SOMOD::Access is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword at deep inside a Resource object", async () => {
    const validator = await getValidator();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          Properties: {
            [keywordAccess.keyword]: "module"
          }
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordAccess.keyword,
        (
          (objNode.properties["Resources"] as JSONObjectNode).properties[
            "MyResource1"
          ] as JSONObjectNode
        ).properties["Properties"] as JSONObjectNode,
        obj.Resources.MyResource1.Properties[
          keywordAccess.keyword
        ] as unknown as "module"
      )
    ).toEqual([
      new Error("SOMOD::Access is allowed only as Resource Property")
    ]);
  });

  test("the validator with keyword as a Resource Property", async () => {
    const validator = await getValidator();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordAccess.keyword]: "module",
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      validator(
        keywordAccess.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordAccess.keyword] as unknown as "module"
      )
    ).toEqual([]);
  });

  test("the processor", async () => {
    const processor = await getProcessor();

    const obj = {
      Resources: {
        MyResource1: {
          Type: "Custom::MyCustomType",
          [keywordAccess.keyword]: "module",
          Properties: {}
        }
      }
    };

    const objNode = parseJson(obj) as JSONObjectNode;

    expect(
      processor(
        keywordAccess.keyword,
        (objNode.properties["Resources"] as JSONObjectNode).properties[
          "MyResource1"
        ] as JSONObjectNode,
        obj.Resources.MyResource1[keywordAccess.keyword] as unknown as "module"
      )
    ).toEqual({ type: "keyword", value: {} });
  });
});

describe("Test util checkAccess from access keyword for", () => {
  const usecases: [string, string, string, string | null, Error[]][] = [
    // no keyword
    [
      "no scope in source, no keyword",
      "m1",
      "@s1/m1",
      null,
      [
        new Error(
          'Referenced module resource {@s1/m1, MyResource1} can not be accessed (has "scope" access).'
        )
      ]
    ],
    [
      "difference scope in source, no keyword",
      "@s2/m1",
      "@s1/m1",
      null,
      [
        new Error(
          'Referenced module resource {@s1/m1, MyResource1} can not be accessed (has "scope" access).'
        )
      ]
    ],
    ["same scope in source, no keyword", "@s1/m2", "@s1/m1", null, []],
    ["same scope & module in source, no keyword", "@s1/m1", "@s1/m1", null, []],

    // keyword = scope
    [
      "no scope in source, keyword = scope",
      "m1",
      "@s1/m1",
      "scope",
      [
        new Error(
          'Referenced module resource {@s1/m1, MyResource1} can not be accessed (has "scope" access).'
        )
      ]
    ],
    [
      "difference scope in source, keyword = scope",
      "@s2/m1",
      "@s1/m1",
      "scope",
      [
        new Error(
          'Referenced module resource {@s1/m1, MyResource1} can not be accessed (has "scope" access).'
        )
      ]
    ],
    ["same scope in source, keyword = scope", "@s1/m2", "@s1/m1", "scope", []],
    [
      "same scope & module in source, keyword = scope",
      "@s1/m1",
      "@s1/m1",
      "scope",
      []
    ],

    // keyword = module
    [
      "no scope in source, keyword = module",
      "m1",
      "@s1/m1",
      "module",
      [
        new Error(
          'Referenced module resource {@s1/m1, MyResource1} can not be accessed (has "module" access).'
        )
      ]
    ],
    [
      "difference scope in source, keyword = module",
      "@s2/m1",
      "@s1/m1",
      "module",
      [
        new Error(
          'Referenced module resource {@s1/m1, MyResource1} can not be accessed (has "module" access).'
        )
      ]
    ],
    [
      "same scope in source, keyword = module",
      "@s1/m2",
      "@s1/m1",
      "module",
      [
        new Error(
          'Referenced module resource {@s1/m1, MyResource1} can not be accessed (has "module" access).'
        )
      ]
    ],
    [
      "same scope & module in source, keyword = module",
      "@s1/m1",
      "@s1/m1",
      "module",
      []
    ],

    // keyword = public
    ["no scope in source, keyword = public", "m1", "@s1/m1", "public", []],
    [
      "difference scope in source, keyword = public",
      "@s2/m1",
      "@s1/m1",
      "public",
      []
    ],
    [
      "same scope in source, keyword = public",
      "@s1/m2",
      "@s1/m1",
      "public",
      []
    ],
    [
      "same scope & module in source, keyword = public",
      "@s1/m1",
      "@s1/m1",
      "public",
      []
    ]
  ];

  test.each(usecases)(
    "%s",
    (title, sourceModule, targetModule, accessValue, expectedErrors) => {
      const resource = { Type: "", Properties: {} };
      if (accessValue) {
        resource[keywordAccess.keyword] = accessValue;
      }
      expect(
        checkAccess(
          sourceModule,
          {
            moduleName: targetModule,
            location: "/a/b/c/z",
            path: "",
            json: { Resources: { MyResource1: resource } }
          },
          "MyResource1"
        )
      ).toEqual(expectedErrors);
    }
  );
});
