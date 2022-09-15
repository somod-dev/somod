import { createFiles, createTempDir, deleteDir } from "../../utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { bundleFunctions } from "../../../src/utils/serverless/bundleFunctions";
import { existsSync } from "fs";
import { keywordFunction } from "../../../src/utils/serverless/keywords/function";

describe("Test util bundleFunctions", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no functions", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/template.yaml": "Resources: {}"
    });
    await expect(
      bundleFunctions(dir, {
        m1: {
          module: "m1",
          packageLocation: dir,
          template: { Resources: {} },
          root: true
        }
      })
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with no functions in template", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "serverless/functions/f1.ts": ""
    });
    await expect(
      bundleFunctions(dir, {
        m1: {
          module: "m1",
          packageLocation: dir,
          template: { Resources: {} },
          root: true
        }
      })
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  test("with functions having unresolved dependencies", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "build/serverless/functions/f1.js": 'export {default} from "node-fetch"'
    });
    await expect(
      bundleFunctions(dir, {
        m1: {
          module: "m1",
          packageLocation: dir,
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
        }
      })
    ).rejects.toMatchObject({
      message: expect.stringContaining(
        "bundle function failed for f1.js from m1 module"
      )
    });
    expect(existsSync(join(dir, ".somod"))).not.toBeTruthy();
  });

  test("with function layers in template", async () => {
    createFiles(dir, {
      "package.json": JSON.stringify({
        name: "m1",
        version: "1.0.0",
        somod: "1.0.0"
      }),
      "build/serverless/functions/f1.js": "const a = 10; export default a;",
      "build/serverless/functions/f2.js":
        'import {difference} from "lodash"; export {default as fetch} from "node-fetch"; const diff = (a, b) => {return difference(a,b);}; export default diff;'
    });
    await expect(
      bundleFunctions(dir, {
        m1: {
          module: "m1",
          packageLocation: dir,
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
                      name: "f2"
                    }
                  },
                  Layers: [{ "SOMOD::Ref": { resource: "L1" } }]
                }
              },
              L1: {
                Type: "AWS::Serverless::LayerVersion",
                Properties: {
                  ContentUri: {
                    "SOMOD::FunctionLayer": {
                      name: "l1",
                      libraries: ["lodash", "node-fetch"]
                    }
                  }
                }
              }
            }
          },
          root: true
        }
      })
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, ".somod/serverless/functions/m1/f1/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
            "var c=Object.defineProperty;var f=Object.getOwnPropertyDescriptor;var l=Object.getOwnPropertyNames;var n=Object.prototype.hasOwnProperty;var p=t=>c(t,\\"__esModule\\",{value:!0});var r=(t,a)=>{for(var e in a)c(t,e,{get:a[e],enumerable:!0})},s=(t,a,e,d)=>{if(a&&typeof a==\\"object\\"||typeof a==\\"function\\")for(let o of l(a))!n.call(t,o)&&(e||o!==\\"default\\")&&c(t,o,{get:()=>a[o],enumerable:!(d=f(a,o))||d.enumerable});return t};var u=(t=>(a,e)=>t&&t.get(a)||(e=s(p({}),a,1),t&&t.set(a,e),e))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var b={};r(b,{default:()=>x});var x=10;module.exports=u(b);0&&(module.exports={});
            "
          `);
    await expect(
      readFile(join(dir, ".somod/serverless/functions/m1/f2/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
      "var n=Object.create;var o=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var l=Object.getPrototypeOf,s=Object.prototype.hasOwnProperty;var a=e=>o(e,\\"__esModule\\",{value:!0});var x=(e,f)=>{for(var r in f)o(e,r,{get:f[r],enumerable:!0})},c=(e,f,r,d)=>{if(f&&typeof f==\\"object\\"||typeof f==\\"function\\")for(let t of u(f))!s.call(e,t)&&(r||t!==\\"default\\")&&o(e,t,{get:()=>f[t],enumerable:!(d=p(f,t))||d.enumerable});return e},h=(e,f)=>c(a(o(e!=null?n(l(e)):{},\\"default\\",!f&&e&&e.__esModule?{get:()=>e.default,enumerable:!0}:{value:e,enumerable:!0})),e),b=(e=>(f,r)=>e&&e.get(f)||(r=c(a({}),f,1),e&&e.set(f,r),r))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var k={};x(k,{default:()=>j,fetch:()=>m.default});var i=require(\\"lodash\\"),m=h(require(\\"node-fetch\\")),g=(e,f)=>(0,i.difference)(e,f),j=g;module.exports=b(k);0&&(module.exports={fetch});
      "
    `);
  });
});
