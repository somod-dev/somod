import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";
import { readFile } from "fs/promises";
import { join } from "path";
import { bundleFunctions } from "../../../src/utils/serverless/bundleFunctions";
import { existsSync } from "fs";
import { keywordFunction } from "../../../src/utils/serverless/keywords/function";
import { ModuleHandler } from "../../../src/utils/moduleHandler";
import { ServerlessTemplateHandler } from "../../../src/utils/serverless/serverlessTemplate/serverlessTemplate";

jest.mock("../../../src/utils/moduleHandler", () => ({
  __esModule: true,
  ModuleHandler: {
    getModuleHandler: jest.fn()
  }
}));

jest.mock(
  "../../../src/utils/serverless/serverlessTemplate/serverlessTemplate",
  () => ({
    __esModule: true,
    ServerlessTemplateHandler: {
      getServerlessTemplateHandler: jest.fn()
    }
  })
);

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
      })
    });

    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    const template = { module: "m0", template: { Resources: {} } };
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [template],
      getTemplate: async () => template
    } as unknown as ServerlessTemplateHandler);

    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
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

    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [
        { module: "m0", template: { Resources: {} } }
      ],
      getTemplate: async () => ({ module: "m0", template: { Resources: {} } })
    } as unknown as ServerlessTemplateHandler);

    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
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
    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    const template = {
      module: "m0",
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
      }
    };
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [template],
      getTemplate: async () => template,
      getNodeRuntimeVersion: () => "16"
    } as unknown as ServerlessTemplateHandler);

    await expect(bundleFunctions(dir)).rejects.toMatchObject({
      message: expect.stringContaining(
        "bundle function failed for f1.js from m0 module"
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

    mockedFunction(ModuleHandler.getModuleHandler).mockReturnValue({
      listModules: async () => [
        { module: { name: "m0", packageLocation: dir } }
      ]
    } as unknown as ModuleHandler);

    const template = {
      module: "m0",
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
      }
    };
    mockedFunction(
      ServerlessTemplateHandler.getServerlessTemplateHandler
    ).mockReturnValue({
      listTemplates: async () => [template],
      getTemplate: async () => template,
      getResource: async (m, r) => template.template.Resources[r],
      getNodeRuntimeVersion: () => "16"
    } as unknown as ServerlessTemplateHandler);

    await expect(bundleFunctions(dir)).resolves.toBeUndefined();
    await expect(
      readFile(join(dir, ".somod/serverless/functions/m0/f1/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
            "var c=Object.defineProperty;var f=Object.getOwnPropertyDescriptor;var l=Object.getOwnPropertyNames;var n=Object.prototype.hasOwnProperty;var p=t=>c(t,\\"__esModule\\",{value:!0});var r=(t,a)=>{for(var e in a)c(t,e,{get:a[e],enumerable:!0})},s=(t,a,e,d)=>{if(a&&typeof a==\\"object\\"||typeof a==\\"function\\")for(let o of l(a))!n.call(t,o)&&(e||o!==\\"default\\")&&c(t,o,{get:()=>a[o],enumerable:!(d=f(a,o))||d.enumerable});return t};var u=(t=>(a,e)=>t&&t.get(a)||(e=s(p({}),a,1),t&&t.set(a,e),e))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var b={};r(b,{default:()=>x});var x=10;module.exports=u(b);0&&(module.exports={});
            "
          `);
    await expect(
      readFile(join(dir, ".somod/serverless/functions/m0/f2/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
      "var n=Object.create;var o=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var l=Object.getPrototypeOf,s=Object.prototype.hasOwnProperty;var a=e=>o(e,\\"__esModule\\",{value:!0});var x=(e,f)=>{for(var r in f)o(e,r,{get:f[r],enumerable:!0})},c=(e,f,r,d)=>{if(f&&typeof f==\\"object\\"||typeof f==\\"function\\")for(let t of u(f))!s.call(e,t)&&(r||t!==\\"default\\")&&o(e,t,{get:()=>f[t],enumerable:!(d=p(f,t))||d.enumerable});return e},h=(e,f)=>c(a(o(e!=null?n(l(e)):{},\\"default\\",!f&&e&&e.__esModule?{get:()=>e.default,enumerable:!0}:{value:e,enumerable:!0})),e),b=(e=>(f,r)=>e&&e.get(f)||(r=c(a({}),f,1),e&&e.set(f,r),r))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var k={};x(k,{default:()=>j,fetch:()=>m.default});var i=require(\\"lodash\\"),m=h(require(\\"node-fetch\\")),g=(e,f)=>(0,i.difference)(e,f),j=g;module.exports=b(k);0&&(module.exports={fetch});
      "
    `);
  });
});
