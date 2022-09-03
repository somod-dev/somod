import { listAllParameters } from "../../../src/utils/parameters/namespace";
import { loadAllParameterValues } from "../../../src/utils/parameters/load";
import { keywordParameter } from "../../../src/utils/keywords/parameter";
import { mockedFunction } from "@sodev/test-utils";
import { parseJson } from "../../../src/utils/jsonTemplate";
import { JSONObjectNode } from "@somod/types";

jest.mock("../../../src/utils/parameters/namespace", () => {
  return {
    __esModule: true,
    listAllParameters: jest.fn()
  };
});

jest.mock("../../../src/utils/parameters/load", () => {
  return {
    __esModule: true,
    loadAllParameterValues: jest.fn()
  };
});

describe("Test parameter keyword", () => {
  beforeEach(() => {
    mockedFunction(listAllParameters).mockReset();
    mockedFunction(listAllParameters).mockResolvedValue({
      p1: "m1",
      "p1.1": "m1",
      p2: "m2"
    });

    mockedFunction(loadAllParameterValues).mockReset();
    mockedFunction(loadAllParameterValues).mockResolvedValue({
      p1: "str",
      "p1.1": true,
      p2: 123
    });
  });

  test("the getValidator calls listAllParameters", async () => {
    await keywordParameter.getValidator("dir1", "m1", {});
    expect(listAllParameters).toHaveBeenCalledTimes(1);
    expect(listAllParameters).toHaveBeenNthCalledWith(1);
  });

  test("the validator with additional properties", async () => {
    const validator = await keywordParameter.getValidator("dir1", "m1", {});

    const obj = {
      [keywordParameter.keyword]: "p1",
      additionalProp: "abcd"
    };

    expect(
      validator(
        keywordParameter.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordParameter.keyword]
      )
    ).toEqual([
      new Error(
        "Object with SOMOD::Parameter must not have additional properties"
      )
    ]);
  });

  test("the validator with non string parameter", async () => {
    const validator = await keywordParameter.getValidator("dir1", "m1", {});

    const obj = {
      [keywordParameter.keyword]: ["p1"]
    };

    expect(
      validator(
        keywordParameter.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordParameter.keyword] as unknown as string
      )
    ).toEqual([new Error("SOMOD::Parameter value must be string")]);
  });

  test("the validator with missing parameter", async () => {
    const validator = await keywordParameter.getValidator("dir1", "m1", {});

    const obj = {
      [keywordParameter.keyword]: "p3"
    };

    expect(
      validator(
        keywordParameter.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordParameter.keyword] as unknown as string
      )
    ).toEqual([
      new Error(
        "parameter p3 referenced by SOMOD::Parameter does not exist. Define p3 in /parameters.yaml"
      )
    ]);
  });

  test("the validator with valid parameter", async () => {
    const validator = await keywordParameter.getValidator("dir1", "m1", {});

    const obj = {
      [keywordParameter.keyword]: "p1.1"
    };

    expect(
      validator(
        keywordParameter.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordParameter.keyword] as unknown as string
      )
    ).toEqual([]);
  });

  test("the getProcessor calls loadAllParameterValues", async () => {
    await keywordParameter.getProcessor("dir1", "m1", {});
    expect(loadAllParameterValues).toHaveBeenCalledTimes(1);
    expect(loadAllParameterValues).toHaveBeenNthCalledWith(1, "dir1");
  });

  test("the processor with missing parameter", async () => {
    const processor = await keywordParameter.getProcessor("dir1", "m1", {});

    const obj = {
      [keywordParameter.keyword]: "p3"
    };

    expect(
      processor(
        keywordParameter.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordParameter.keyword]
      )
    ).toEqual({ type: "object", value: undefined });
  });

  test("the processor with valid parameter", async () => {
    const processor = await keywordParameter.getProcessor("dir1", "m1", {});

    const obj = {
      [keywordParameter.keyword]: "p1.1"
    };

    expect(
      processor(
        keywordParameter.keyword,
        parseJson(obj) as JSONObjectNode,
        obj[keywordParameter.keyword]
      )
    ).toEqual({ type: "object", value: true });
  });
});
