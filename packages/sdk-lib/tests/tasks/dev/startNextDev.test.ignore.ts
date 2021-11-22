import { startNextDev } from "../../../src";

describe("Test task startNextDev", () => {
  test("on dev machine", async () => {
    await startNextDev(process.env.PML_NEXT_PROJECT);
  }, 1000000);
});
