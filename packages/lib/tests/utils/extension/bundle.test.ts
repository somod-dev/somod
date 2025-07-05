import { readdir, readFile } from "fs/promises";
import { createFiles, createTempDir, deleteDir } from "nodejs-file-utils";
import { join } from "path";
import { IContext } from "somod-types";
import { bundle } from "../../../src/utils/extension/bundle";

describe("Test util extension.bundle", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no extension file", async () => {
    createFiles(dir, {
      "package.json": "{}"
    });
    let expectedFilePath = join(dir, "extension.ts");
    if (process.platform == "win32") {
      expectedFilePath = expectedFilePath.replace(/\\/g, "\\\\");
    }
    await expect(
      bundle({
        dir,
        serverlessTemplateHandler: { functionNodeRuntimeVersion: "16" }
      } as IContext)
    ).rejects.toEqual(
      new Error(
        `Build failed with 1 error:\nerror: Could not resolve "${expectedFilePath}"`
      )
    );
    await expect(readdir(dir)).resolves.toEqual(["package.json"]);
  });

  test("For a extension file", async () => {
    createFiles(dir, {
      "extension.ts": "export const preBuild = 10;",
      "package.json": "{}"
    });
    await expect(
      bundle({
        dir,
        serverlessTemplateHandler: { functionNodeRuntimeVersion: "16" }
      } as IContext)
    ).resolves.toBeUndefined();

    const bundledExtension = await readFile(
      join(dir, "build/extension.js"),
      "utf8"
    );
    const bundledExtensionLines = bundledExtension.split("\n");
    expect(bundledExtensionLines.length).toEqual(3);

    expect(bundledExtensionLines[0]).toEqual(
      `var t=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var n=(o,e)=>{for(var r in e)t(o,r,{get:e[r],enumerable:!0})},s=(o,e,r,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let p of i(e))!l.call(o,p)&&p!==r&&t(o,p,{get:()=>e[p],enumerable:!(c=d(e,p))||c.enumerable});return o};var u=o=>s(t({},"__esModule",{value:!0}),o);var B={};n(B,{preBuild:()=>x});module.exports=u(B);var x=10;0&&(module.exports={preBuild});`
    );
    expect(
      bundledExtensionLines[1].startsWith(
        "//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cm"
      )
    ).toBeTruthy();
    expect(bundledExtensionLines[2]).toEqual("");
  });

  test("For overrided bundleConfig", async () => {
    createFiles(dir, {
      "extension.ts": "export const preBuild = 10;",
      "package.json": '{"ExtensionBuildOptions": {"sourcemap": false}}'
    });
    await expect(
      bundle({
        dir,
        serverlessTemplateHandler: { functionNodeRuntimeVersion: "16" }
      } as IContext)
    ).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, "build/extension.js"), "utf8")
    ).resolves.toEqual(
      `var t=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var n=(o,e)=>{for(var r in e)t(o,r,{get:e[r],enumerable:!0})},s=(o,e,r,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let p of i(e))!l.call(o,p)&&p!==r&&t(o,p,{get:()=>e[p],enumerable:!(c=d(e,p))||c.enumerable});return o};var u=o=>s(t({},"__esModule",{value:!0}),o);var B={};n(B,{preBuild:()=>x});module.exports=u(B);var x=10;0&&(module.exports={preBuild});
`
    );
  });
});
