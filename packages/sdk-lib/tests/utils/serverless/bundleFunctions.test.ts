import { childProcess } from "@solib/cli-base";
import { createFiles, createTempDir, deleteDir } from "@sodev/test-utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { bundleFunctions } from "../../../src/utils/serverless/bundleFunctions";
import { existsSync } from "fs";
import { keywordFunction } from "../../../src/utils/serverless/keywords/function";

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
      "serverless/functions/f1.ts": 'export {default} from "node-fetch"'
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
      "serverless/functions/f1.ts":
        'export {difference as default} from "lodash"'
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
            "var d=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var i=Object.getOwnPropertyNames;var l=Object.prototype.hasOwnProperty;var m=f=>d(f,\\"__esModule\\",{value:!0});var n=(f,e)=>{for(var r in e)d(f,r,{get:e[r],enumerable:!0})},p=(f,e,r,o)=>{if(e&&typeof e==\\"object\\"||typeof e==\\"function\\")for(let a of i(e))!l.call(f,a)&&(r||a!==\\"default\\")&&d(f,a,{get:()=>e[a],enumerable:!(o=c(e,a))||o.enumerable});return f};var s=(f=>(e,r)=>f&&f.get(e)||(r=p(m({}),e,1),f&&f.set(e,r),r))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var u={};n(u,{default:()=>t.difference});var t=require(\\"lodash\\");module.exports=s(u);0&&(module.exports={});
            "
          `);
  });

  test("with function excludes in template", async () => {
    createFiles(dir, {
      "serverless/functions/f1.ts": "const a = 10; export default a;",
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
            "var c=Object.defineProperty;var f=Object.getOwnPropertyDescriptor;var l=Object.getOwnPropertyNames;var n=Object.prototype.hasOwnProperty;var p=t=>c(t,\\"__esModule\\",{value:!0});var r=(t,a)=>{for(var e in a)c(t,e,{get:a[e],enumerable:!0})},s=(t,a,e,d)=>{if(a&&typeof a==\\"object\\"||typeof a==\\"function\\")for(let o of l(a))!n.call(t,o)&&(e||o!==\\"default\\")&&c(t,o,{get:()=>a[o],enumerable:!(d=f(a,o))||d.enumerable});return t};var u=(t=>(a,e)=>t&&t.get(a)||(e=s(p({}),a,1),t&&t.set(a,e),e))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var b={};r(b,{default:()=>x});var x=10;module.exports=u(b);0&&(module.exports={});
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
