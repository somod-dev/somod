import { existsSync } from "fs";
import { readFile, symlink } from "fs/promises";
import { join } from "path";
import { IContext } from "somod-types";
import { bundleFunctions } from "../../../src/utils/serverless/bundleFunctions";
import { getDeclaredFunctions } from "../../../src/utils/serverless/keywords/function";
import {
  createFiles,
  createTempDir,
  deleteDir,
  mockedFunction
} from "../../utils";

jest.mock("../../../src/utils/serverless/keywords/function", () => {
  const original = jest.requireActual(
    "../../../src/utils/serverless/keywords/function"
  );
  return { __esModule: true, ...original, getDeclaredFunctions: jest.fn() };
});

describe("Test util bundleFunctions", () => {
  let dir: string;
  beforeEach(() => {
    dir = createTempDir("test-somod-lib");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("with no functions", async () => {
    mockedFunction(getDeclaredFunctions).mockResolvedValue([]);
    await expect(
      bundleFunctions({
        dir,
        moduleHandler: { list: [{ module: { name: "m1" } }] },
        serverlessTemplateHandler: {
          listTemplates: () => [{ module: "m1", template: {} }]
        }
      } as IContext)
    ).resolves.toBeUndefined();
    expect(existsSync(join(dir, "build"))).not.toBeTruthy();
  });

  if (process.platform != "win32") {
    test("with functions having unresolved dependencies", async () => {
      createFiles(dir, {
        "build/serverless/functions/f1.js":
          'export {default} from "node-fetch"',
        "node_modules/": ""
      });

      await symlink(
        join(__dirname, "../../../../middleware"),
        join(dir, "node_modules/somod-middleware")
      );
      mockedFunction(getDeclaredFunctions).mockResolvedValue([
        { name: "f1", module: "m1", exclude: [], middlewares: [] }
      ]);
      await expect(
        bundleFunctions({
          dir,
          moduleHandler: {
            list: [{ module: { name: "m1" } }],
            getModule: (() => ({
              module: { name: "m1", version: "v1.0.0", packageLocation: dir },
              parents: [],
              children: []
            })) as IContext["moduleHandler"]["getModule"]
          },
          serverlessTemplateHandler: {
            listTemplates: () => [{ module: "m1", template: {} }],
            functionNodeRuntimeVersion: "16"
          }
        } as IContext)
      ).rejects.toMatchObject({
        message: expect.stringContaining(
          'ERROR: Could not resolve "node-fetch"'
        )
      });
      expect(
        existsSync(join(dir, ".somod/serverless/functions"))
      ).not.toBeTruthy();
    });

    test("with function layers and middlewares in template", async () => {
      createFiles(dir, {
        "build/serverless/functions/f1.js": "const a = 10; export default a;",
        "build/serverless/functions/f2.js":
          'import {difference} from "lodash"; export {default as fetch} from "node-fetch"; const diff = (a, b) => {return difference(a,b);}; export default diff;',
        "node_modules/m2/build/serverless/functions/middlewares/middleware1.js":
          "const middleware = (next, event, context) => {return next();}; export default middleware;"
      });

      await symlink(
        join(__dirname, "../../../../middleware"),
        join(dir, "node_modules/somod-middleware")
      );

      mockedFunction(getDeclaredFunctions).mockResolvedValue([
        {
          name: "f1",
          module: "m1",
          exclude: [],
          middlewares: [{ module: "m2", name: "middleware1" }]
        },
        {
          name: "f2",
          module: "m1",
          exclude: ["lodash", "node-fetch"],
          middlewares: []
        }
      ]);

      await expect(
        bundleFunctions({
          dir,
          moduleHandler: {
            list: [{ module: { name: "m1" } }],
            getModule: (m => {
              const modules = {
                m1: {
                  module: {
                    name: "m1",
                    version: "v1.0.0",
                    packageLocation: dir
                  },
                  parents: [],
                  children: []
                },
                m2: {
                  module: {
                    name: "m2",
                    version: "v1.0.0",
                    packageLocation: join(dir, "node_modules/m2")
                  },
                  parents: [],
                  children: []
                }
              };
              return modules[m];
            }) as IContext["moduleHandler"]["getModule"]
          },
          serverlessTemplateHandler: {
            listTemplates: () => [{ module: "m1", template: {} }],
            functionNodeRuntimeVersion: "16"
          },
          getModuleHash: m => `MMM${m}MMM`
        } as IContext)
      ).resolves.toBeUndefined();

      await expect(
        readFile(join(dir, ".somod/serverless/.functions/m1/f1.js"), "utf8")
      ).resolves.toMatchInlineSnapshot(`
        "import { getMiddlewareHandler } from \\"somod-middleware\\";
        import lambdaFn from \\"../../../../build/serverless/functions/f1\\";
        import mMMMm2MMMmiddleware1 from \\"../../../../node_modules/m2/build/serverless/functions/middlewares/middleware1\\";
        const handler = getMiddlewareHandler(lambdaFn, [mMMMm2MMMmiddleware1]);
        export default handler;
        "
      `);
      await expect(
        readFile(join(dir, ".somod/serverless/.functions/m1/f2.js"), "utf8")
      ).resolves.toMatchInlineSnapshot(`
        "import { getMiddlewareHandler } from \\"somod-middleware\\";
        import lambdaFn from \\"../../../../build/serverless/functions/f2\\";
        const handler = getMiddlewareHandler(lambdaFn, []);
        export default handler;
        "
      `);

      await expect(
        readFile(
          join(dir, ".somod/serverless/functions/m1/f1/index.js"),
          "utf8"
        )
      ).resolves.toMatchInlineSnapshot(`
        "var C=Object.create;var v=Object.defineProperty;var H=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var P=Object.getPrototypeOf,R=Object.prototype.hasOwnProperty;var y=(r,t)=>()=>(t||r((t={exports:{}}).exports,t),t.exports),S=(r,t)=>{for(var e in t)v(r,e,{get:t[e],enumerable:!0})},m=(r,t,e,u)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of B(t))!R.call(r,i)&&i!==e&&v(r,i,{get:()=>t[i],enumerable:!(u=H(t,i))||u.enumerable});return r};var T=(r,t,e)=>(e=r!=null?C(P(r)):{},m(t||!r||!r.__esModule?v(e,"default",{value:r,enumerable:!0}):e,r)),q=r=>m(v({},"__esModule",{value:!0}),r);var _=y(o=>{"use strict";var w=o&&o.__assign||function(){return w=Object.assign||function(r){for(var t,e=1,u=arguments.length;e<u;e++){t=arguments[e];for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(r[i]=t[i])}return r},w.apply(this,arguments)},b=o&&o.__awaiter||function(r,t,e,u){function i(n){return n instanceof e?n:new e(function(c){c(n)})}return new(e||(e=Promise))(function(n,c){function d(l){try{a(u.next(l))}catch(s){c(s)}}function f(l){try{a(u.throw(l))}catch(s){c(s)}}function a(l){l.done?n(l.value):i(l.value).then(d,f)}a((u=u.apply(r,t||[])).next())})},g=o&&o.__generator||function(r,t){var e={label:0,sent:function(){if(n[0]&1)throw n[1];return n[1]},trys:[],ops:[]},u,i,n,c;return c={next:d(0),throw:d(1),return:d(2)},typeof Symbol=="function"&&(c[Symbol.iterator]=function(){return this}),c;function d(a){return function(l){return f([a,l])}}function f(a){if(u)throw new TypeError("Generator is already executing.");for(;c&&(c=0,a[0]&&(e=0)),e;)try{if(u=1,i&&(n=a[0]&2?i.return:a[0]?i.throw||((n=i.return)&&n.call(i),0):i.next)&&!(n=n.call(i,a[1])).done)return n;switch(i=0,n&&(a=[a[0]&2,n.value]),a[0]){case 0:case 1:n=a;break;case 4:return e.label++,{value:a[1],done:!1};case 5:e.label++,i=a[1],a=[0];continue;case 7:a=e.ops.pop(),e.trys.pop();continue;default:if(n=e.trys,!(n=n.length>0&&n[n.length-1])&&(a[0]===6||a[0]===2)){e=0;continue}if(a[0]===3&&(!n||a[1]>n[0]&&a[1]<n[3])){e.label=a[1];break}if(a[0]===6&&e.label<n[1]){e.label=n[1],n=a;break}if(n&&e.label<n[2]){e.label=n[2],e.ops.push(a);break}n[2]&&e.ops.pop(),e.trys.pop();continue}a=t.call(r,e)}catch(l){a=[6,l],i=0}finally{u=n=0}if(a[0]&5)throw a[1];return{value:a[0]?a[1]:void 0,done:!0}}};o.__esModule=!0;o.getMiddlewareHandler=o.MiddlewareContext=void 0;var M=function(){function r(){var t=this.constructor;this.context={},Object.setPrototypeOf(this,t.prototype)}return r.prototype.set=function(t,e){this.context[t]=e},r.prototype.get=function(t){return this.context[t]},r}();o.MiddlewareContext=M;var D=function(r,t,e){return b(void 0,void 0,void 0,function(){var u;return g(this,function(i){switch(i.label){case 0:u=r(t,e,null),i.label=1;case 1:return typeof(u==null?void 0:u.then)!="function"?[3,3]:[4,u];case 2:return u=i.sent(),[3,1];case 3:return[2,u]}})})},E=function(r,t){return function(e,u){return b(void 0,void 0,void 0,function(){var i,n,c;return g(this,function(d){switch(d.label){case 0:return i=w(w({},e),{somodMiddlewareContext:new M}),n=t.length,c=function(){return b(void 0,void 0,void 0,function(){var f,a,l;return g(this,function(s){switch(s.label){case 0:return n>0?(f=t[--n],[4,f(c,i,u)]):[3,2];case 1:return a=s.sent(),[2,a];case 2:return[4,D(r,i,u)];case 3:return l=s.sent(),[2,l]}})})},[4,c()];case 1:return[2,d.sent()]}})})}};o.getMiddlewareHandler=E});var x=y(h=>{"use strict";var F=h&&h.__createBinding||(Object.create?function(r,t,e,u){u===void 0&&(u=e);var i=Object.getOwnPropertyDescriptor(t,e);(!i||("get"in i?!t.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return t[e]}}),Object.defineProperty(r,u,i)}:function(r,t,e,u){u===void 0&&(u=e),r[u]=t[e]});h.__esModule=!0;h.getMiddlewareHandler=void 0;var G=_();F(h,G,"getMiddlewareHandler")});var A={};S(A,{default:()=>z});module.exports=q(A);var j=T(x());var O=10;var L=(r,t,e)=>r(),p=L;var W=(0,j.getMiddlewareHandler)(O,[p]),z=W;
        "
      `);
      await expect(
        readFile(
          join(dir, ".somod/serverless/functions/m1/f2/index.js"),
          "utf8"
        )
      ).resolves.toMatchInlineSnapshot(`
        "var H=Object.create;var v=Object.defineProperty;var B=Object.getOwnPropertyDescriptor;var P=Object.getOwnPropertyNames;var R=Object.getPrototypeOf,S=Object.prototype.hasOwnProperty;var y=(r,t)=>()=>(t||r((t={exports:{}}).exports,t),t.exports),T=(r,t)=>{for(var e in t)v(r,e,{get:t[e],enumerable:!0})},_=(r,t,e,u)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of P(t))!S.call(r,i)&&i!==e&&v(r,i,{get:()=>t[i],enumerable:!(u=B(t,i))||u.enumerable});return r};var m=(r,t,e)=>(e=r!=null?H(R(r)):{},_(t||!r||!r.__esModule?v(e,"default",{value:r,enumerable:!0}):e,r)),q=r=>_(v({},"__esModule",{value:!0}),r);var x=y(l=>{"use strict";var w=l&&l.__assign||function(){return w=Object.assign||function(r){for(var t,e=1,u=arguments.length;e<u;e++){t=arguments[e];for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(r[i]=t[i])}return r},w.apply(this,arguments)},b=l&&l.__awaiter||function(r,t,e,u){function i(n){return n instanceof e?n:new e(function(c){c(n)})}return new(e||(e=Promise))(function(n,c){function f(o){try{a(u.next(o))}catch(d){c(d)}}function s(o){try{a(u.throw(o))}catch(d){c(d)}}function a(o){o.done?n(o.value):i(o.value).then(f,s)}a((u=u.apply(r,t||[])).next())})},g=l&&l.__generator||function(r,t){var e={label:0,sent:function(){if(n[0]&1)throw n[1];return n[1]},trys:[],ops:[]},u,i,n,c;return c={next:f(0),throw:f(1),return:f(2)},typeof Symbol=="function"&&(c[Symbol.iterator]=function(){return this}),c;function f(a){return function(o){return s([a,o])}}function s(a){if(u)throw new TypeError("Generator is already executing.");for(;c&&(c=0,a[0]&&(e=0)),e;)try{if(u=1,i&&(n=a[0]&2?i.return:a[0]?i.throw||((n=i.return)&&n.call(i),0):i.next)&&!(n=n.call(i,a[1])).done)return n;switch(i=0,n&&(a=[a[0]&2,n.value]),a[0]){case 0:case 1:n=a;break;case 4:return e.label++,{value:a[1],done:!1};case 5:e.label++,i=a[1],a=[0];continue;case 7:a=e.ops.pop(),e.trys.pop();continue;default:if(n=e.trys,!(n=n.length>0&&n[n.length-1])&&(a[0]===6||a[0]===2)){e=0;continue}if(a[0]===3&&(!n||a[1]>n[0]&&a[1]<n[3])){e.label=a[1];break}if(a[0]===6&&e.label<n[1]){e.label=n[1],n=a;break}if(n&&e.label<n[2]){e.label=n[2],e.ops.push(a);break}n[2]&&e.ops.pop(),e.trys.pop();continue}a=t.call(r,e)}catch(o){a=[6,o],i=0}finally{u=n=0}if(a[0]&5)throw a[1];return{value:a[0]?a[1]:void 0,done:!0}}};l.__esModule=!0;l.getMiddlewareHandler=l.MiddlewareContext=void 0;var M=function(){function r(){var t=this.constructor;this.context={},Object.setPrototypeOf(this,t.prototype)}return r.prototype.set=function(t,e){this.context[t]=e},r.prototype.get=function(t){return this.context[t]},r}();l.MiddlewareContext=M;var D=function(r,t,e){return b(void 0,void 0,void 0,function(){var u;return g(this,function(i){switch(i.label){case 0:u=r(t,e,null),i.label=1;case 1:return typeof(u==null?void 0:u.then)!="function"?[3,3]:[4,u];case 2:return u=i.sent(),[3,1];case 3:return[2,u]}})})},E=function(r,t){return function(e,u){return b(void 0,void 0,void 0,function(){var i,n,c;return g(this,function(f){switch(f.label){case 0:return i=w(w({},e),{somodMiddlewareContext:new M}),n=t.length,c=function(){return b(void 0,void 0,void 0,function(){var s,a,o;return g(this,function(d){switch(d.label){case 0:return n>0?(s=t[--n],[4,s(c,i,u)]):[3,2];case 1:return a=d.sent(),[2,a];case 2:return[4,D(r,i,u)];case 3:return o=d.sent(),[2,o]}})})},[4,c()];case 1:return[2,f.sent()]}})})}};l.getMiddlewareHandler=E});var O=y(h=>{"use strict";var F=h&&h.__createBinding||(Object.create?function(r,t,e,u){u===void 0&&(u=e);var i=Object.getOwnPropertyDescriptor(t,e);(!i||("get"in i?!t.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return t[e]}}),Object.defineProperty(r,u,i)}:function(r,t,e,u){u===void 0&&(u=e),r[u]=t[e]});h.__esModule=!0;h.getMiddlewareHandler=void 0;var G=x();F(h,G,"getMiddlewareHandler")});var I={};T(I,{default:()=>A});module.exports=q(I);var C=m(O());var p=require("lodash"),W=m(require("node-fetch")),L=(r,t)=>(0,p.difference)(r,t),j=L;var z=(0,C.getMiddlewareHandler)(j,[]),A=z;
        "
      `);
    });

    // @TODO: Check this test later
    test.skip("with verbose and debug mode in context", async () => {
      createFiles(dir, {
        "build/serverless/functions/f1.js": "const a = 10; export default a;",
        "node_modules/": ""
      });

      await symlink(
        join(__dirname, "../../../../middleware"),
        join(dir, "node_modules/somod-middleware")
      );

      mockedFunction(getDeclaredFunctions).mockResolvedValue([
        {
          name: "f1",
          module: "m1",
          exclude: [],
          middlewares: []
        }
      ]);

      await expect(
        bundleFunctions(
          {
            dir,
            moduleHandler: {
              list: [{ module: { name: "m1" } }],
              getModule: (m => {
                const modules = {
                  m1: {
                    module: {
                      name: "m1",
                      version: "v1.0.0",
                      packageLocation: dir
                    },
                    parents: [],
                    children: []
                  }
                };
                return modules[m];
              }) as IContext["moduleHandler"]["getModule"]
            },
            serverlessTemplateHandler: {
              listTemplates: () => [{ module: "m1", template: {} }],
              functionNodeRuntimeVersion: "16"
            },
            getModuleHash: m => `MMM${m}MMM`,
            isDebugMode: true
          } as IContext,
          true
        )
      ).resolves.toBeUndefined();

      await expect(
        readFile(join(dir, ".somod/serverless/.functions/m1/f1.js"), "utf8")
      ).resolves.toMatchInlineSnapshot(`
        "import { getMiddlewareHandler } from \\"somod-middleware\\";
        import lambdaFn from \\"../../../../build/serverless/functions/f1\\";
        const handler = getMiddlewareHandler(lambdaFn, []);
        export default handler;
        "
      `);

      const bundledFunction = await readFile(
        join(dir, ".somod/serverless/functions/m1/f1/index.js"),
        "utf8"
      );
      const bundledFunctionSegments = bundledFunction.split(
        "//# sourceMappingURL"
      );
      expect(bundledFunctionSegments.length).toEqual(2);

      const bundledCodeLines = bundledFunctionSegments[0].split("\n");
      bundledCodeLines[257] = "";
      bundledCodeLines[264] = "";
      bundledCodeLines[268] = "";

      expect(bundledCodeLines.join("\n")).toMatchInlineSnapshot();
      expect(
        bundledFunctionSegments[1].startsWith(
          "=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vL"
        )
      ).toBeTruthy();
    });
  }
});
