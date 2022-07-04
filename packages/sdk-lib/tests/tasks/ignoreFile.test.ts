import { save, update } from "../../src/utils/ignoreFile";
import { saveIgnore, updateIgnore } from "../../src";
import { mockedFunction } from "@sodev/test-utils";

jest.mock("../../src/utils/ignoreFile", () => {
  return {
    __esModule: true,
    save: jest.fn(),
    update: jest.fn()
  };
});

describe("test Task ignoreFile Tasks", () => {
  beforeEach(() => {
    mockedFunction(save).mockReset();
    mockedFunction(update).mockReset();
  });

  test("for save", async () => {
    await expect(saveIgnore("", ".gitignore")).resolves.toBeUndefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("", ".gitignore");
  });

  test("for update with no paths", async () => {
    await expect(updateIgnore("", ".gitignore")).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith("", [], ".gitignore");
  });

  test("for update with paths", async () => {
    await expect(
      updateIgnore("", ".gitignore", ["build"])
    ).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith("", ["build"], ".gitignore");
  });
});
