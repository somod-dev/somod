import { readdir, readFile } from "fs/promises";
import { createFiles, createTempDir, deleteDir } from "nodejs-file-utils";
import { join } from "path";
import { bundle } from "../../../src/utils/lifeCycle/bundle";

describe("Test util lifeCycle.bundle", () => {
  let dir: string = null;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("For no lifeCycle file", async () => {
    await expect(bundle(dir)).resolves.toBeUndefined();
    await expect(readdir(dir)).resolves.toEqual([]);
  });

  test("For a lifeCycle file", async () => {
    createFiles(dir, {
      "lifeCycle.ts": "export const preBuild = 10;",
      "package.json": "{}"
    });
    await expect(bundle(dir)).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, "build/lifeCycle.js"), "utf8")
    ).resolves.toContain(
      `var t=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var n=o=>t(o,"__esModule",{value:!0});var s=(o,e)=>{for(var p in e)t(o,p,{get:e[p],enumerable:!0})},u=(o,e,p,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of i(e))!l.call(o,r)&&(p||r!=="default")&&t(o,r,{get:()=>e[r],enumerable:!(c=d(e,r))||c.enumerable});return o};var x=(o=>(e,p)=>o&&o.get(e)||(p=u(n({}),e,1),o&&o.set(e,p),p))(typeof WeakMap!="undefined"?new WeakMap:0);var a={};s(a,{preBuild:()=>B});var B=10;module.exports=x(a);0&&(module.exports={preBuild});
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcHJpdmF0ZS92YXIvZm9sZGV`
    );
  });

  test("For overrided bundleConfig", async () => {
    createFiles(dir, {
      "lifeCycle.ts": "export const preBuild = 10;",
      "package.json": '{"LifeCycleEsbuildOptions": {"sourcemap": false}}'
    });
    await expect(bundle(dir)).resolves.toBeUndefined();

    await expect(
      readFile(join(dir, "build/lifeCycle.js"), "utf8")
    ).resolves.toEqual(
      `var t=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var n=o=>t(o,"__esModule",{value:!0});var s=(o,e)=>{for(var p in e)t(o,p,{get:e[p],enumerable:!0})},u=(o,e,p,c)=>{if(e&&typeof e=="object"||typeof e=="function")for(let r of i(e))!l.call(o,r)&&(p||r!=="default")&&t(o,r,{get:()=>e[r],enumerable:!(c=d(e,r))||c.enumerable});return o};var x=(o=>(e,p)=>o&&o.get(e)||(p=u(n({}),e,1),o&&o.set(e,p),p))(typeof WeakMap!="undefined"?new WeakMap:0);var a={};s(a,{preBuild:()=>B});var B=10;module.exports=x(a);0&&(module.exports={preBuild});
`
    );
  });
});
