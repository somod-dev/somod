import { createSet } from "../src/dynamodb-client";

describe("Test the dynamodb client", () => {
  test("createSet default type", () => {
    const set = createSet(["A", "B", "C"]) as {
      type: "String" | "Number" | "Binary";
      wrapperName: "Set";
      values: string[];
    };
    expect(set.type).toEqual("String");
    expect(set.wrapperName).toEqual("Set");
    expect(set.values).toEqual(["A", "B", "C"]);
  });

  test("createSet number type", () => {
    const set = createSet([1, 2, 3], "number") as {
      type: "String" | "Number" | "Binary";
      wrapperName: "Set";
      values: string[];
    };
    expect(set.type).toEqual("Number");
    expect(set.wrapperName).toEqual("Set");
    expect(set.values).toEqual([1, 2, 3]);
  });
});
