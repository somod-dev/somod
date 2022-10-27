import { mockedFunction } from "../utils";
import { KeywordProcessor, KeywordValidator } from "somod-types";
import { cloneDeep } from "lodash";
import {
  parseJson,
  validateKeywords,
  processKeywords,
  JSONTemplateError
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
    key1: jest.fn().mockReturnValue([]),
    key2: jest.fn().mockResolvedValue([]),
    key3: jest.fn().mockReturnValue([])
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
      jsonNode["properties"]["key2"]["properties"]["y"]["items"][0],
      json.key2.y[0].key1
    );
    expect(validators.key1).toHaveBeenNthCalledWith(
      2,
      "key1",
      jsonNode["properties"]["a"],
      json.a.key1
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

  test("for no validators", async () => {
    await expect(validateKeywords(jsonNode, {})).resolves.toEqual([]);
    expect(validators.key1).toBeCalledTimes(0);
    expect(validators.key2).toBeCalledTimes(0);
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for one validator without error", async () => {
    await expect(
      validateKeywords(jsonNode, { key1: validators.key1 })
    ).resolves.toEqual([]);
    expect(validators.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith();
    expect(validators.key2).toBeCalledTimes(0);
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for one validator with errors", async () => {
    const errors = [new Error("Mocked Error 1")];
    mockedFunction(validators.key1).mockReturnValueOnce(errors);
    const actualErrors = await validateKeywords(jsonNode, {
      key1: validators.key1
    });
    expect(actualErrors).toEqual([
      new JSONTemplateError(
        jsonNode["properties"]["key2"]["properties"]["y"]["items"][0],
        errors[0]
      )
    ]);
    expect(validators.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith();
    expect(validators.key2).toBeCalledTimes(0);
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for two validators with errors", async () => {
    const errors = [new Error("Mocked Error 1"), new Error("Mocked Error 2")];
    mockedFunction(validators.key1).mockReturnValueOnce([errors[0]]);
    mockedFunction(validators.key2).mockReturnValue([errors[1]]);
    await expect(
      validateKeywords(jsonNode, {
        key1: validators.key1,
        key2: validators.key2
      })
    ).resolves.toEqual([
      new JSONTemplateError(
        jsonNode["properties"]["key2"]["properties"]["y"]["items"][0],
        errors[0]
      ),
      new JSONTemplateError(jsonNode, errors[1])
    ]);
    expect(validators.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith();
    expect(validators.key2).toBeCalledTimes(1);
    expectKey2ToBeCalledWith();
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for validators returning Promise", async () => {
    mockedFunction(validators.key1).mockResolvedValue([]);
    mockedFunction(validators.key2).mockResolvedValue([]);
    await expect(
      validateKeywords(jsonNode, {
        key1: validators.key1,
        key2: validators.key2
      })
    ).resolves.toEqual([]);
    expect(validators.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith();
    expect(validators.key2).toBeCalledTimes(1);
    expectKey2ToBeCalledWith();
    expect(validators.key3).toBeCalledTimes(0);
  });

  test("for validators returning errors in Promise", async () => {
    const errors = [new Error("Mocked Error 1"), new Error("Mocked Error 2")];
    mockedFunction(validators.key1).mockResolvedValueOnce([errors[0]]);
    mockedFunction(validators.key2).mockResolvedValue([errors[1]]);
    await expect(
      validateKeywords(jsonNode, {
        key1: validators.key1,
        key2: validators.key2
      })
    ).resolves.toEqual([
      new JSONTemplateError(
        jsonNode["properties"]["key2"]["properties"]["y"]["items"][0],
        errors[0]
      ),
      new JSONTemplateError(jsonNode, errors[1])
    ]);
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
    key4: jest.fn(),
    key5: jest.fn()
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
      y: [{ key1: "k1", key5: "__p" }]
    }
  };

  const jsonNode = parseJson(json);

  const expectKey1ToBeCalledWith = (i: number) => {
    const expectations = [
      () => {
        expect(processors.key1).toHaveBeenNthCalledWith(
          1,
          "key1",
          jsonNode["properties"]["key2"]["properties"]["y"]["items"][0],
          json.key2.y[0].key1
        );
      },
      () => {
        expect(processors.key1).toHaveBeenNthCalledWith(
          2,
          "key1",
          jsonNode["properties"]["a"],
          json.a.key1
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

  test("for no processors", async () => {
    await expect(processKeywords(jsonNode, {})).resolves.toEqual(json);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for object replacer", async () => {
    mockedFunction(processors.key1).mockReturnValue({
      type: "object",
      value: "replaced value"
    });
    const jsonClone = cloneDeep(json);
    // @ts-expect-error this is fine
    jsonClone.a = "replaced value";
    // @ts-expect-error this is fine
    jsonClone.key2.y[0] = "replaced value";

    await expect(
      processKeywords(jsonNode, { key1: processors.key1 })
    ).resolves.toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith(1);
    expectKey1ToBeCalledWith(2);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for multiple object replacer", async () => {
    mockedFunction(processors.key1).mockReturnValue({
      type: "object",
      value: "replaced value"
    });
    mockedFunction(processors.key4).mockReturnValue({
      type: "object",
      value: "replaced value"
    });

    await expect(
      processKeywords(jsonNode, {
        key1: processors.key1,
        key4: processors.key4
      })
    ).rejects.toEqual(
      new Error(
        `Error at a : Object replacement can not be combined with other object/keyword replacements. The keywords are key1, key4`
      )
    );
    expect(processors.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith(1);
    expectKey1ToBeCalledWith(2);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });

  test("for keyword replacer without additional keys", async () => {
    mockedFunction(processors.key2).mockReturnValue({
      type: "keyword",
      value: {}
    });

    const jsonClone = cloneDeep(json);
    delete jsonClone.key2;

    await expect(
      processKeywords(jsonNode, {
        key2: processors.key2
      })
    ).resolves.toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(1);
    expectKey2ToBeCalledWith();
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for keyword replacer with additional keys", async () => {
    mockedFunction(processors.key2).mockReturnValue({
      type: "keyword",
      value: { key2replacement: "waw" }
    });

    const jsonClone = cloneDeep(json);
    delete jsonClone.key2;
    // @ts-expect-error this is fine
    jsonClone.key2replacement = "waw";

    await expect(
      processKeywords(jsonNode, {
        key2: processors.key2
      })
    ).resolves.toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(1);
    expectKey2ToBeCalledWith();
    expect(processors.key3).toBeCalledTimes(0);
    expect(processors.key4).toBeCalledTimes(0);
  });

  test("for multiple keyword replacer", async () => {
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

    await expect(
      processKeywords(jsonNode, {
        key3: processors.key3,
        key4: processors.key4
      })
    ).resolves.toEqual(jsonClone);
    expect(processors.key1).toBeCalledTimes(0);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(1);
    expectKey3ToBeCalledWith();
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });

  test("for object replacer (returning object) and keyword replacers", async () => {
    mockedFunction(processors.key1).mockReturnValue({
      type: "object",
      value: { key1replacement: "replacedkey1" }
    });
    mockedFunction(processors.key3).mockResolvedValue({
      type: "keyword",
      value: { key3replacement: "waw" }
    });
    mockedFunction(processors.key4).mockReturnValue({
      type: "keyword",
      value: {}
    });

    await expect(
      processKeywords(jsonNode, {
        key1: processors.key1,
        key3: processors.key3,
        key4: processors.key4
      })
    ).rejects.toEqual(
      new Error(
        `Error at a : Object replacement can not be combined with other object/keyword replacements. The keywords are key1, key3, key4`
      )
    );
    expect(processors.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith(1);
    expectKey1ToBeCalledWith(2);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(1);
    expectKey3ToBeCalledWith();
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });

  test("for object replacer (returning string) and keyword replacers", async () => {
    mockedFunction(processors.key1).mockResolvedValue({
      type: "object",
      value: "replacedkey1"
    });
    mockedFunction(processors.key3).mockReturnValue({
      type: "keyword",
      value: { key3replacement: "waw" }
    });
    mockedFunction(processors.key4).mockResolvedValue({
      type: "keyword",
      value: {}
    });

    await expect(
      processKeywords(jsonNode, {
        key1: processors.key1,
        key3: processors.key3,
        key4: processors.key4
      })
    ).rejects.toEqual(
      new Error(
        `Error at a : Object replacement can not be combined with other object/keyword replacements. The keywords are key1, key3, key4`
      )
    );
    expect(processors.key1).toBeCalledTimes(2);
    expectKey1ToBeCalledWith(1);
    expectKey1ToBeCalledWith(2);
    expect(processors.key2).toBeCalledTimes(0);
    expect(processors.key3).toBeCalledTimes(1);
    expectKey3ToBeCalledWith();
    expect(processors.key4).toBeCalledTimes(1);
    expectKey4ToBeCalledWith();
  });

  test("for object replacer with no level", async () => {
    mockedFunction(processors.key5).mockResolvedValue({
      type: "object",
      value: "replacedkey5"
    });

    const jsonClone = cloneDeep(json);
    // @ts-expect-error this is ok
    jsonClone.key2.y = ["replacedkey5"];

    await expect(
      processKeywords(jsonNode, {
        key5: processors.key5
      })
    ).resolves.toEqual(jsonClone);
  });

  test("for object replacer with level 0", async () => {
    mockedFunction(processors.key5).mockResolvedValue({
      type: "object",
      value: "replacedkey5",
      level: 0
    });

    const jsonClone = cloneDeep(json);
    // @ts-expect-error this is ok
    jsonClone.key2.y = ["replacedkey5"];

    await expect(
      processKeywords(jsonNode, {
        key5: processors.key5
      })
    ).resolves.toEqual(jsonClone);
  });

  test("for object replacer with level 1", async () => {
    mockedFunction(processors.key5).mockResolvedValue({
      type: "object",
      value: "replacedkey5",
      level: 1
    });

    const jsonClone = cloneDeep(json);
    // @ts-expect-error this is ok
    jsonClone.key2.y = "replacedkey5";

    await expect(
      processKeywords(jsonNode, {
        key5: processors.key5
      })
    ).resolves.toEqual(jsonClone);
  });

  test("for object replacer with level 2", async () => {
    mockedFunction(processors.key5).mockResolvedValue({
      type: "object",
      value: "replacedkey5",
      level: 2
    });

    const jsonClone = cloneDeep(json);
    // @ts-expect-error this is ok
    jsonClone.key2 = "replacedkey5";

    await expect(
      processKeywords(jsonNode, {
        key5: processors.key5
      })
    ).resolves.toEqual(jsonClone);
  });

  test("for object replacer with level 3", async () => {
    mockedFunction(processors.key5).mockResolvedValue({
      type: "object",
      value: "replacedkey5",
      level: 3
    });

    await expect(
      processKeywords(jsonNode, {
        key5: processors.key5
      })
    ).resolves.toEqual("replacedkey5");
  });

  test("for object replacer with level 4", async () => {
    mockedFunction(processors.key5).mockResolvedValue({
      type: "object",
      value: "replacedkey5",
      level: 4
    });

    await expect(
      processKeywords(jsonNode, {
        key5: processors.key5
      })
    ).rejects.toEqual(
      new Error(
        "Error at key2.y.0 : Object replacement at level 4 was not possible"
      )
    );
  });
});
