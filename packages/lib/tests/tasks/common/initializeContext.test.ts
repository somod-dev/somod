import { IContext } from "somod-types";
import { initializeContext } from "../../../src";
import { Context } from "../../../src/utils/context";
import { mockedFunction } from "../../utils";

jest.mock("../../../src/utils/context", () => {
  return {
    __esModule: true,
    Context: { getInstance: jest.fn() }
  };
});

describe("Test Task initializeContext", () => {
  afterEach(() => {
    mockedFunction(Context.getInstance).mockReset();
  });
  test("for successfull initialization", async () => {
    mockedFunction(Context.getInstance).mockResolvedValue({
      dir: "Success"
    } as IContext);

    await expect(
      initializeContext("sample", true, false, true)
    ).resolves.toEqual({
      dir: "Success"
    });
    expect(Context.getInstance).toHaveBeenCalledTimes(1);
    expect(Context.getInstance).toHaveBeenCalledWith(
      "sample",
      true,
      false,
      true
    );
  });

  test("for failed initialization", async () => {
    mockedFunction(Context.getInstance).mockRejectedValue(
      new Error("There is an error in context initialization")
    );

    await expect(
      initializeContext("sample", false, false, false)
    ).rejects.toEqual(new Error("There is an error in context initialization"));
    expect(Context.getInstance).toHaveBeenCalledTimes(1);
    expect(Context.getInstance).toHaveBeenCalledWith(
      "sample",
      false,
      false,
      false
    );
  });
});
