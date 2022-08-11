import { Filter } from "../../../src/utils/parameters/filters";

describe("Test util parameters.filters", () => {
  test("default filters", () => {
    const filter = Filter.getFilter();

    expect(Object.keys(filter["filters"])).toEqual([
      "ajvStandalone",
      "jsonParse",
      "jsonStringify"
    ]);
  });

  test("with additional filters", () => {
    const filter = Filter.getFilter();
    filter.register("customFilter", (ip: string) => {
      return ip + ip;
    });

    expect(Object.keys(filter["filters"])).toEqual([
      "ajvStandalone",
      "jsonParse",
      "jsonStringify",
      "customFilter"
    ]);
  });

  test("with apply ajvStandalone", async () => {
    const filter = Filter.getFilter();

    await expect(
      filter.apply(
        {
          type: "object",
          properties: {
            name: { type: "string" }
          }
        },
        ["ajvStandalone"]
      )
    ).resolves.toMatchSnapshot();
  });

  test("with apply multiple filters", async () => {
    const filter = Filter.getFilter();
    filter.register("customFilter", (ip: string) => {
      return ip + ip;
    });

    await expect(
      filter.apply(
        {
          type: "object",
          properties: {
            name: { type: "string" }
          }
        },
        ["jsonStringify", "jsonParse", "ajvStandalone", "customFilter"]
      )
    ).resolves.toMatchSnapshot();
  });
});
