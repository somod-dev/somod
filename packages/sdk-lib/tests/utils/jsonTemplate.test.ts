import { mockedFunction } from "@sodev/test-utils";
import { cloneDeep } from "lodash";
import {
  KeywordValidator,
  KeywordProcessor,
  parseJson,
  validateKeywords,
  processKeywords
} from "../../src/utils/jsonTemplate";

describe("Test util jsonTemplate.parseJson", () => {
  test("for string", () => {
    expect(parseJson("sample")).toMatchSnapshot();
  });
  test("for number", () => {
    expect(parseJson(123)).toMatchSnapshot();
  });
  test("for boolean", () => {
    expect(parseJson(false)).toMatchSnapshot();
  });

  test("for null", () => {
    expect(parseJson(null)).toMatchSnapshot();
  });

  test("for empty array", () => {
    expect(parseJson([])).toMatchSnapshot();
  });

  test("for simple array", () => {
    expect(parseJson(["sample", 123, true, null])).toMatchSnapshot();
  });

  test("for nested array", () => {
    expect(
      parseJson(["sample", 123, true, null, ["nested", ["level2"], { a: 10 }]])
    ).toMatchSnapshot();
  });

  test("for empty object", () => {
    expect(parseJson({})).toMatchSnapshot();
  });

  test("for simple object", () => {
    expect(
      parseJson({
        str: "sample",
        num: 123,
        bool: true,
        null: null,
        arr: ["sample"]
      })
    ).toMatchSnapshot();
  });

  test("for nested object", () => {
    expect(
      parseJson({
        str: "sample",
        num: 123,
        bool: true,
        null: null,
        arr: ["sample"],
        obj: {
          a: { b: 10 },
          p: false,
          x: [100]
        }
      })
    ).toMatchSnapshot();
  });
});

describe("Test util jsonTemplate.validateKeywords", () => {
  const validators: Record<string, KeywordValidator> = {
    key1: jest.fn(),
    key2: jest.fn(),
    key3: jest.fn()
  };

  const json = {
    a: {
      key1: {
        x: 10
      }
    },
    key2: {
      y: [{ key1: "k1", p: "__p" }]
    }
  };

  const jsonNode = parseJson(json);

  const expectKey1ToBeCalledWith = () => {
    expect(validators.key1).toHaveBeenNthCalledWith(
      1,
      "key1",
      jsonNode["properties"]["a"],
      json.a.key1
    );
    expect(validators.key1).toHaveBeenNthCalledWith(
      2,
      "key1",
      jsonNode["properties"]["key2"]["properties"]["y"]["items"][0],
      json.key2.y[0].key1
    );
  };

  const expectKey2ToBeCalledWith = () => {
    expect(validators.key2).toHaveBeenNthCalledWith(
      1,
      "key2",
      jsonNode,
      json.key2
    );
  };

  beforeEach(() => {
    Object.keys(validators).forEach(key => {
      mockedFunction(validators[key]).mockClear();
    });
  });

  test("for no validators", () => {
    expect(validateKeywords(jsonNode, {})).toEqual([]);
    expect(validators.key1).toBeCalledTimes(0);
    expect(validators.key2).toBeCalledTimes(0);
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for one validator without error", () => {
    expect(validateKeywords(jsonNode, { key1: validators.key1 })).toEqual([]);
    expect(validators.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith();
    expect(validators.key2).toBeCalledTimes(0);
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for one validator with errors", () => {
    const errors = [new Error("Mocked Error 1")];
    mockedFunction(validators.key1).mockReturnValueOnce(errors);
    expect(validateKeywords(jsonNode, { key1: validators.key1 })).toEqual(
      errors
    );
    expect(validators.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith();
    expect(validators.key2).toBeCalledTimes(0);
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for two validators with errors", () => {
    const errors = [new Error("Mocked Error 1"), new Error("Mocked Error 2")];
    mockedFunction(validators.key1).mockReturnValueOnce([errors[0]]);
    mockedFunction(validators.key2).mockReturnValue([errors[1]]);
    expect(
      validateKeywords(jsonNode, {
        key1: validators.key1,
        key2: validators.key2
      })
    ).toEqual(errors);
    expect(validators.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith();
    expect(validators.key2).toBeCalledTimes(1);
    expectKey2ToBeCalledWith();
    expect(validators.key3).toBeCalledTimes(0);
  });
});

describe("Test util jsonTemplate.processKeywords", () => {
  const processors: Record<string, KeywordProcessor> = {
    key1: jest.fn(),
    key2: jest.fn(),
    key3: jest.fn(),
    key4: jest.fn()
  };

  const json = {
    a: {
      key1: {
        x: 10
      },
      key3: "hi",
      key4: "welcome"
    },
    key2: {
      y: [{ key1: "k1", p: "__p" }]
    }
  };

  const jsonNode = parseJson(json);

  const expectKey1ToBeCalledWith = (i: number) => {
    const expectations = [
      () => {
        expect(processors.key1).toHaveBeenNthCalledWith(
          1,
          "key1",
          jsonNode["properties"]["a"],
          json.a.key1
        );
      },
      () => {
        expect(processors.key1).toHaveBeenNthCalledWith(
          2,
          "key1",
          jsonNode["properties"]["key2"]["properties"]["y"]["items"][0],
          json.key2.y[0].key1
        );
      }
    ];
    expectations[i - 1]();
  };

  const expectKey2ToBeCalledWith = () => {
    expect(processors.key2).toHaveBeenNthCalledWith(
      1,
      "key2",
      jsonNode,
      json.key2
    );
  };

  const expectKey3ToBeCalledWith = () => {
    expect(processors.key3).toHaveBeenNthCalledWith(
      1,
      "key3",
      jsonNode["properties"]["a"],
      json.a.key3
    );
  };

  const expectKey4ToBeCalledWith = () => {
    expect(processors.key4).toHaveBeenNthCalledWith(
      1,
      "key4",
      jsonNode["properties"]["a"],
      json.a.key4
    );
  };

  beforeEach(() => {
    Object.keys(processors).forEach(key => {
      mockedFunction(processors[key]).mockClear();
    });
  });

  test("for no processors", () => {
    expect(processKeywords(jsonNode, {})).toEqual(json);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for object replacer", () => {
    mockedFunction(processors.key1).mockReturnValue({
      type: "object",
      value: "replaced value"
    });
    const jsonClone = cloneDeep(json);
    // @ts-expect-error this is fine
    jsonClone.a = "replaced value";
    // @ts-expect-error this is fine
    jsonClone.key2.y[0] = "replaced value";

    expect(processKeywords(jsonNode, { key1: processors.key1 })).toEqual(
      jsonClone
    );
    expect(processors.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith(1);
    expectKey1ToBeCalledWith(2);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for multiple object replacer", () => {
    mockedFunction(processors.key1).mockReturnValue({
      type: "object",
      value: "replaced value"
    });
    mockedFunction(processors.key4).mockReturnValue({
      type: "object",
      value: "replaced value"
    });

    expect(() =>
      processKeywords(jsonNode, {
        key1: processors.key1,
        key4: processors.key4
      })
    ).toThrow(
      `Object replacement is allowed for only one keyword, Found key1,key4`
    );
    expect(processors.key1).toBeCalledTimes(1);
    expectKey1ToBeCalledWith(1);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });

  test("for keyword replacer without additional keys", () => {
    mockedFunction(processors.key2).mockReturnValue({
      type: "keyword",
      value: {}
    });

    const jsonClone = cloneDeep(json);
    delete jsonClone.key2;

    expect(
      processKeywords(jsonNode, {
        key2: processors.key2
      })
    ).toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(1);
    expectKey2ToBeCalledWith();
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for keyword replacer with additional keys", () => {
    mockedFunction(processors.key2).mockReturnValue({
      type: "keyword",
      value: { key2replacement: "waw" }
    });

    const jsonClone = cloneDeep(json);
    delete jsonClone.key2;
    // @ts-expect-error this is fine
    jsonClone.key2replacement = "waw";

    expect(
      processKeywords(jsonNode, {
        key2: processors.key2
      })
    ).toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(1);
    expectKey2ToBeCalledWith();
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for multiple keyword replacer", () => {
    mockedFunction(processors.key3).mockReturnValue({
      type: "keyword",
      value: { key3replacement: "waw" }
    });
    mockedFunction(processors.key4).mockReturnValue({
      type: "keyword",
      value: {}
    });

    const jsonClone = cloneDeep(json);
    delete jsonClone.a.key3;
    delete jsonClone.a.key4;
    // @ts-expect-error this is fine
    jsonClone.a.key3replacement = "waw";

    expect(
      processKeywords(jsonNode, {
        key3: processors.key3,
        key4: processors.key4
      })
    ).toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(1);
    expectKey3ToBeCalledWith();
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });

  test("for object replacer (returning object) and keyword replacers", () => {
    mockedFunction(processors.key1).mockReturnValue({
      type: "object",
      value: { key1replacement: "replacedkey1" }
    });
    mockedFunction(processors.key3).mockReturnValue({
      type: "keyword",
      value: { key3replacement: "waw" }
    });
    mockedFunction(processors.key4).mockReturnValue({
      type: "keyword",
      value: {}
    });

    const jsonClone = cloneDeep(json);
    jsonClone.a = {
      // @ts-expect-error this is fine
      key1replacement: "replacedkey1"
    };
    // @ts-expect-error this is fine
    jsonClone.a.key3replacement = "waw";
    jsonClone.key2.y[0] = {
      // @ts-expect-error this is fine
      key1replacement: "replacedkey1"
    };

    expect(
      processKeywords(jsonNode, {
        key1: processors.key1,
        key3: processors.key3,
        key4: processors.key4
      })
    ).toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith(1);
    expectKey1ToBeCalledWith(2);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(1);
    expectKey3ToBeCalledWith();
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });

  test("for object replacer (returning string) and keyword replacers", () => {
    mockedFunction(processors.key1).mockReturnValue({
      type: "object",
      value: "replacedkey1"
    });
    mockedFunction(processors.key3).mockReturnValue({
      type: "keyword",
      value: { key3replacement: "waw" }
    });
    mockedFunction(processors.key4).mockReturnValue({
      type: "keyword",
      value: {}
    });

    const jsonClone = cloneDeep(json);
    // @ts-expect-error this is fine
    jsonClone.a = "replacedkey1";
    // @ts-expect-error this is fine
    jsonClone.key2.y[0] = "replacedkey1";

    expect(
      processKeywords(jsonNode, {
        key1: processors.key1,
        key3: processors.key3,
        key4: processors.key4
      })
    ).toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith(1);
    expectKey1ToBeCalledWith(2);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(1);
    expectKey3ToBeCalledWith();
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });
});
