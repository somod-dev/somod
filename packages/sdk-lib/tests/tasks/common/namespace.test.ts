import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { loadAndResolveNamespaces } from "../../../src";

const mockNamespaces: Awaited<ReturnType<ModuleHandler["getNamespaces"]>> = {
  namespace1: { n1: "m1", n2: "m2" },
  namespace2: { n3: "m3" }
};

jest.mock("../../../src/utils/moduleHandler", () => {
  return {
    __esModule: true,
    ModuleHandler: {
      getModuleHandler: jest.fn().mockReturnValue({
        getNamespaces: jest.fn().mockResolvedValue({
          namespace1: { n1: "m1", n2: "m2" },
          namespace2: { n3: "m3" }
        })
      })
    }
  };
});

describe("test Task loadAndResolveNamespaces", () => {
  test("for njp only", async () => {
    await expect(loadAndResolveNamespaces("", ["njp"])).resolves.toEqual(
      mockNamespaces
    );
    expect(ModuleHandler.getModuleHandler).toHaveBeenCalledTimes(1);
    expect(ModuleHandler.getModuleHandler).toHaveBeenCalledWith("", ["njp"]);

    const moduleHandler = ModuleHandler.getModuleHandler("", ["njp"]);
    expect(moduleHandler.getNamespaces).toHaveBeenCalledTimes(1);
  });
});
