import { childProcess } from "@solib/cli-base";
import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { bundleFunctions } from "../../../src/utils/serverless-new/bundleFunctions";
import { existsSync } from "fs";
import { keywordFunction } from "../../../src/utils/serverless-new/keywords/function";

describe("Test util bundleFunctions", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no functions", async () => {
    await expect(
      bundleFunctions(dir, {
        module: "m1",
        packageLocation: "",
        template: { Resources: {} },
        root: true
      })
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with no functions in template", async () => {
    createFiles(dir, { "serverless/functions/f1.ts": "" });
    await expect(
      bundleFunctions(dir, {
        module: "m1",
        packageLocation: "",
        template: { Resources: {} },
        root: true
      })
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with functions having unresolved dependencies", async () => {
    createFiles(dir, {
      "serverless/functions/f1.ts":
        'export {default as fetch} from "node-fetch"'
    });
    await expect(
      bundleFunctions(dir, {
        module: "m1",
        packageLocation: "",
        template: {
          Resources: {
            F1: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: {
                  [keywordFunction.keyword]: {
                    name: "f1"
                  }
                }
              }
            }
          }
        },
        root: true
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining("bundle function failed for f1.ts")
    });
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with functions having dependency on default excludes", async () => {
    createFiles(dir, {
      "serverless/functions/f1.ts": 'export {difference} from "lodash"'
    });
    await expect(
      bundleFunctions(dir, {
        module: "m1",
        packageLocation: "",
        template: {
          Resources: {
            F1: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: {
                  [keywordFunction.keyword]: {
                    name: "f1"
                  }
                }
              }
            }
          }
        },
        root: true
      })
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/serverless/functions/f1/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
            "var c=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var n=Object.getOwnPropertyNames;var p=Object.prototype.hasOwnProperty;var t=f=>c(f,\\"__esModule\\",{value:!0});var x=(f,e)=>{for(var r in e)c(f,r,{get:e[r],enumerable:!0})},a=(f,e,r,d)=>{if(e&&typeof e==\\"object\\"||typeof e==\\"function\\")for(let o of n(e))!p.call(f,o)&&(r||o!==\\"default\\")&&c(f,o,{get:()=>e[o],enumerable:!(d=m(e,o))||d.enumerable});return f};var b=(f=>(e,r)=>f&&f.get(e)||(r=a(t({}),e,1),f&&f.set(e,r),r))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var g={};x(g,{difference:()=>i.difference});var i=require(\\"lodash\\");module.exports=b(g);0&&(module.exports={difference});
            "
          `);
  });

  test("with function excludes in template", async () => {
    createFiles(dir, {
      "serverless/functions/f1.ts": "export const a = 10;",
      "serverless/functions/f2.ts":
        'import {difference} from "lodash"; export {default as fetch} from "node-fetch"; const diff = (a:string[], b:string[]):string[] => {return difference(a,b);}; export default diff;',
      "package.json": JSON.stringify({ name: "waw", devDependencies: {} })
    });
    await childProcess(dir, process.platform == "win32" ? "npm.cmd" : "npm", [
      "install",
      "lodash",
      "node-fetch"
    ]);
    await expect(
      bundleFunctions(dir, {
        module: "m1",
        packageLocation: "",
        template: {
          Resources: {
            F1: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: {
                  [keywordFunction.keyword]: {
                    name: "f1"
                  }
                }
              }
            },
            F2: {
              Type: "AWS::Serverless::Function",
              Properties: {
                CodeUri: {
                  [keywordFunction.keyword]: {
                    name: "f2",
                    exclude: ["node-fetch"]
                  }
                }
              }
            }
          }
        },
        root: true
      })
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, "build/serverless/functions/f1/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
            "var e=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var r=Object.getOwnPropertyNames;var s=Object.prototype.hasOwnProperty;var x=t=>e(t,\\"__esModule\\",{value:!0});var b=(t,o)=>{for(var a in o)e(t,a,{get:o[a],enumerable:!0})},d=(t,o,a,n)=>{if(o&&typeof o==\\"object\\"||typeof o==\\"function\\")for(let c of r(o))!s.call(t,c)&&(a||c!==\\"default\\")&&e(t,c,{get:()=>o[c],enumerable:!(n=p(o,c))||n.enumerable});return t};var f=(t=>(o,a)=>t&&t.get(o)||(a=d(x({}),o,1),t&&t.set(o,a),a))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var h={};b(h,{a:()=>g});var g=10;module.exports=f(h);0&&(module.exports={a});
            "
          `);
    await expect(
      readFile(join(dir, "build/serverless/functions/f2/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
            "var c=Object.create;var i=Object.defineProperty;var g=Object.getOwnPropertyDescriptor;var m=Object.getOwnPropertyNames;var p=Object.getPrototypeOf,u=Object.prototype.hasOwnProperty;var o=r=>i(r,\\"__esModule\\",{value:!0});var l=(r,t)=>{for(var e in t)i(r,e,{get:t[e],enumerable:!0})},s=(r,t,e,n)=>{if(t&&typeof t==\\"object\\"||typeof t==\\"function\\")for(let f of m(t))!u.call(r,f)&&(e||f!==\\"default\\")&&i(r,f,{get:()=>t[f],enumerable:!(n=g(t,f))||n.enumerable});return r},x=(r,t)=>s(o(i(r!=null?c(p(r)):{},\\"default\\",!t&&r&&r.__esModule?{get:()=>r.default,enumerable:!0}:{value:r,enumerable:!0})),r),h=(r=>(t,e)=>r&&r.get(t)||(e=s(o({}),t,1),r&&r.set(t,e),e))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var k={};l(k,{default:()=>j,fetch:()=>a.default});var d=require(\\"lodash\\"),a=x(require(\\"node-fetch\\")),b=(r,t)=>(0,d.difference)(r,t),j=b;module.exports=h(k);0&&(module.exports={fetch});
            "
          `);
  }, 20000);
});
