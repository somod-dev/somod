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
    await expect(bundle({ dir } as IContext)).rejects.toEqual(
      new Error(
        `Build failed with 1 error:\nerror: Could not resolve "${dir}/extension.ts"`
      )
    );
    await expect(readdir(dir)).resolves.toEqual(["package.json"]);
  });

  test("For a extension file", async () => {
    createFiles(dir, {
      "extension.ts": "export const preBuild = 10;",
      "package.json": "{}"
    });
    await expect(bundle({ dir } as IContext)).resolves.toBeUndefined();

    const bundledExtension = await readFile(
      join(dir, "build/extension.js"),
      "utf8"
    );
    const bundledExtensionLines = bundledExtension.split("\n");
    expect(bundledExtensionLines.length).toEqual(3);

    expect(bundledExtensionLines[0]).toEqual(
      `var t=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var n=o=>t(o,"__esModule",{value:!0});var s=(o,e)=>{for(var p in e)t(o,p,{get:e[p],enumerable:!0})},u=(o,e,p,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of i(e))!l.call(o,r)&&(p||r!=="default")&&t(o,r,{get:()=>e[r],enumerable:!(c=d(e,r))||c.enumerable});return o};var x=(o=>(e,p)=>o&&o.get(e)||(p=u(n({}),e,1),o&&o.set(e,p),p))(typeof WeakMap!="undefined"?new WeakMap:0);var a={};s(a,{preBuild:()=>B});var B=10;module.exports=x(a);0&&(module.exports={preBuild});`
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
    await expect(bundle({ dir } as IContext)).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, "build/extension.js"), "utf8")
    ).resolves.toEqual(
      `var t=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var n=o=>t(o,"__esModule",{value:!0});var s=(o,e)=>{for(var p in e)t(o,p,{get:e[p],enumerable:!0})},u=(o,e,p,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of i(e))!l.call(o,r)&&(p||r!=="default")&&t(o,r,{get:()=>e[r],enumerable:!(c=d(e,r))||c.enumerable});return o};var x=(o=>(e,p)=>o&&o.get(e)||(p=u(n({}),e,1),o&&o.set(e,p),p))(typeof WeakMap!="undefined"?new WeakMap:0);var a={};s(a,{preBuild:()=>B});var B=10;module.exports=x(a);0&&(module.exports={preBuild});
`
    );
  });
});
