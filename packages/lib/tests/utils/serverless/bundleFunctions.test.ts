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
        "var B=Object.create;var v=Object.defineProperty;var P=Object.getOwnPropertyDescriptor;var R=Object.getOwnPropertyNames;var S=Object.getPrototypeOf,T=Object.prototype.hasOwnProperty;var m=n=>v(n,\\"__esModule\\",{value:!0});var M=(n,t)=>()=>(t||n((t={exports:{}}).exports,t),t.exports),q=(n,t)=>{for(var e in t)v(n,e,{get:t[e],enumerable:!0})},_=(n,t,e,u)=>{if(t&&typeof t==\\"object\\"||typeof t==\\"function\\")for(let i of R(t))!T.call(n,i)&&(e||i!==\\"default\\")&&v(n,i,{get:()=>t[i],enumerable:!(u=P(t,i))||u.enumerable});return n},D=(n,t)=>_(m(v(n!=null?B(S(n)):{},\\"default\\",!t&&n&&n.__esModule?{get:()=>n.default,enumerable:!0}:{value:n,enumerable:!0})),n),E=(n=>(t,e)=>n&&n.get(t)||(e=_(m({}),t,1),n&&n.set(t,e),e))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var O=M(l=>{\\"use strict\\";var w=l&&l.__assign||function(){return w=Object.assign||function(n){for(var t,e=1,u=arguments.length;e<u;e++){t=arguments[e];for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(n[i]=t[i])}return n},w.apply(this,arguments)},g=l&&l.__awaiter||function(n,t,e,u){function i(r){return r instanceof e?r:new e(function(c){c(r)})}return new(e||(e=Promise))(function(r,c){function d(o){try{a(u.next(o))}catch(f){c(f)}}function s(o){try{a(u.throw(o))}catch(f){c(f)}}function a(o){o.done?r(o.value):i(o.value).then(d,s)}a((u=u.apply(n,t||[])).next())})},y=l&&l.__generator||function(n,t){var e={label:0,sent:function(){if(r[0]&1)throw r[1];return r[1]},trys:[],ops:[]},u,i,r,c;return c={next:d(0),throw:d(1),return:d(2)},typeof Symbol==\\"function\\"&&(c[Symbol.iterator]=function(){return this}),c;function d(a){return function(o){return s([a,o])}}function s(a){if(u)throw new TypeError(\\"Generator is already executing.\\");for(;c&&(c=0,a[0]&&(e=0)),e;)try{if(u=1,i&&(r=a[0]&2?i.return:a[0]?i.throw||((r=i.return)&&r.call(i),0):i.next)&&!(r=r.call(i,a[1])).done)return r;switch(i=0,r&&(a=[a[0]&2,r.value]),a[0]){case 0:case 1:r=a;break;case 4:return e.label++,{value:a[1],done:!1};case 5:e.label++,i=a[1],a=[0];continue;case 7:a=e.ops.pop(),e.trys.pop();continue;default:if(r=e.trys,!(r=r.length>0&&r[r.length-1])&&(a[0]===6||a[0]===2)){e=0;continue}if(a[0]===3&&(!r||a[1]>r[0]&&a[1]<r[3])){e.label=a[1];break}if(a[0]===6&&e.label<r[1]){e.label=r[1],r=a;break}if(r&&e.label<r[2]){e.label=r[2],e.ops.push(a);break}r[2]&&e.ops.pop(),e.trys.pop();continue}a=t.call(n,e)}catch(o){a=[6,o],i=0}finally{u=r=0}if(a[0]&5)throw a[1];return{value:a[0]?a[1]:void 0,done:!0}}};l.__esModule=!0;l.getMiddlewareHandler=l.MiddlewareContext=void 0;var x=function(){function n(){var t=this.constructor;this.context={},Object.setPrototypeOf(this,t.prototype)}return n.prototype.set=function(t,e){this.context[t]=e},n.prototype.get=function(t){return this.context[t]},n}();l.MiddlewareContext=x;var F=function(n,t,e,u){return g(void 0,void 0,void 0,function(){var i;return y(this,function(r){switch(r.label){case 0:i=n(t,e,u),r.label=1;case 1:return typeof(i==null?void 0:i.then)!=\\"function\\"?[3,3]:[4,i];case 2:return i=r.sent(),[3,1];case 3:return[2,i]}})})},G=function(n,t){return function(e,u,i){return g(void 0,void 0,void 0,function(){var r,c,d;return y(this,function(s){switch(s.label){case 0:return r=w(w({},e),{somodMiddlewareContext:new x}),c=t.length,d=function(){return g(void 0,void 0,void 0,function(){var a,o,f;return y(this,function(b){switch(b.label){case 0:return c>0?(a=t[--c],[4,a(d,r,u)]):[3,2];case 1:return o=b.sent(),[2,o];case 2:return[4,F(n,r,u,i)];case 3:return f=b.sent(),[2,f]}})})},[4,d()];case 1:return[2,s.sent()]}})})}};l.getMiddlewareHandler=G});var p=M(h=>{\\"use strict\\";var L=h&&h.__createBinding||(Object.create?function(n,t,e,u){u===void 0&&(u=e);var i=Object.getOwnPropertyDescriptor(t,e);(!i||(\\"get\\"in i?!t.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return t[e]}}),Object.defineProperty(n,u,i)}:function(n,t,e,u){u===void 0&&(u=e),n[u]=t[e]});h.__esModule=!0;h.getMiddlewareHandler=void 0;var W=O();L(h,W,\\"getMiddlewareHandler\\")});var J={};q(J,{default:()=>I});var H=D(p());var j=10;var z=(n,t,e)=>n(),C=z;var A=(0,H.getMiddlewareHandler)(j,[C]),I=A;module.exports=E(J);0&&(module.exports={});
        "
      `);
      await expect(
        readFile(
          join(dir, ".somod/serverless/functions/m1/f2/index.js"),
          "utf8"
        )
      ).resolves.toMatchInlineSnapshot(`
        "var P=Object.create;var v=Object.defineProperty;var R=Object.getOwnPropertyDescriptor;var S=Object.getOwnPropertyNames;var T=Object.getPrototypeOf,q=Object.prototype.hasOwnProperty;var _=n=>v(n,\\"__esModule\\",{value:!0});var m=(n,e)=>()=>(e||n((e={exports:{}}).exports,e),e.exports),D=(n,e)=>{for(var t in e)v(n,t,{get:e[t],enumerable:!0})},M=(n,e,t,u)=>{if(e&&typeof e==\\"object\\"||typeof e==\\"function\\")for(let i of S(e))!q.call(n,i)&&(t||i!==\\"default\\")&&v(n,i,{get:()=>e[i],enumerable:!(u=R(e,i))||u.enumerable});return n},x=(n,e)=>M(_(v(n!=null?P(T(n)):{},\\"default\\",!e&&n&&n.__esModule?{get:()=>n.default,enumerable:!0}:{value:n,enumerable:!0})),n),E=(n=>(e,t)=>n&&n.get(e)||(t=M(_({}),e,1),n&&n.set(e,t),t))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var p=m(l=>{\\"use strict\\";var w=l&&l.__assign||function(){return w=Object.assign||function(n){for(var e,t=1,u=arguments.length;t<u;t++){e=arguments[t];for(var i in e)Object.prototype.hasOwnProperty.call(e,i)&&(n[i]=e[i])}return n},w.apply(this,arguments)},g=l&&l.__awaiter||function(n,e,t,u){function i(r){return r instanceof t?r:new t(function(c){c(r)})}return new(t||(t=Promise))(function(r,c){function f(o){try{a(u.next(o))}catch(s){c(s)}}function d(o){try{a(u.throw(o))}catch(s){c(s)}}function a(o){o.done?r(o.value):i(o.value).then(f,d)}a((u=u.apply(n,e||[])).next())})},y=l&&l.__generator||function(n,e){var t={label:0,sent:function(){if(r[0]&1)throw r[1];return r[1]},trys:[],ops:[]},u,i,r,c;return c={next:f(0),throw:f(1),return:f(2)},typeof Symbol==\\"function\\"&&(c[Symbol.iterator]=function(){return this}),c;function f(a){return function(o){return d([a,o])}}function d(a){if(u)throw new TypeError(\\"Generator is already executing.\\");for(;c&&(c=0,a[0]&&(t=0)),t;)try{if(u=1,i&&(r=a[0]&2?i.return:a[0]?i.throw||((r=i.return)&&r.call(i),0):i.next)&&!(r=r.call(i,a[1])).done)return r;switch(i=0,r&&(a=[a[0]&2,r.value]),a[0]){case 0:case 1:r=a;break;case 4:return t.label++,{value:a[1],done:!1};case 5:t.label++,i=a[1],a=[0];continue;case 7:a=t.ops.pop(),t.trys.pop();continue;default:if(r=t.trys,!(r=r.length>0&&r[r.length-1])&&(a[0]===6||a[0]===2)){t=0;continue}if(a[0]===3&&(!r||a[1]>r[0]&&a[1]<r[3])){t.label=a[1];break}if(a[0]===6&&t.label<r[1]){t.label=r[1],r=a;break}if(r&&t.label<r[2]){t.label=r[2],t.ops.push(a);break}r[2]&&t.ops.pop(),t.trys.pop();continue}a=e.call(n,t)}catch(o){a=[6,o],i=0}finally{u=r=0}if(a[0]&5)throw a[1];return{value:a[0]?a[1]:void 0,done:!0}}};l.__esModule=!0;l.getMiddlewareHandler=l.MiddlewareContext=void 0;var O=function(){function n(){var e=this.constructor;this.context={},Object.setPrototypeOf(this,e.prototype)}return n.prototype.set=function(e,t){this.context[e]=t},n.prototype.get=function(e){return this.context[e]},n}();l.MiddlewareContext=O;var F=function(n,e,t,u){return g(void 0,void 0,void 0,function(){var i;return y(this,function(r){switch(r.label){case 0:i=n(e,t,u),r.label=1;case 1:return typeof(i==null?void 0:i.then)!=\\"function\\"?[3,3]:[4,i];case 2:return i=r.sent(),[3,1];case 3:return[2,i]}})})},G=function(n,e){return function(t,u,i){return g(void 0,void 0,void 0,function(){var r,c,f;return y(this,function(d){switch(d.label){case 0:return r=w(w({},t),{somodMiddlewareContext:new O}),c=e.length,f=function(){return g(void 0,void 0,void 0,function(){var a,o,s;return y(this,function(b){switch(b.label){case 0:return c>0?(a=e[--c],[4,a(f,r,u)]):[3,2];case 1:return o=b.sent(),[2,o];case 2:return[4,F(n,r,u,i)];case 3:return s=b.sent(),[2,s]}})})},[4,f()];case 1:return[2,d.sent()]}})})}};l.getMiddlewareHandler=G});var j=m(h=>{\\"use strict\\";var L=h&&h.__createBinding||(Object.create?function(n,e,t,u){u===void 0&&(u=t);var i=Object.getOwnPropertyDescriptor(e,t);(!i||(\\"get\\"in i?!e.__esModule:i.writable||i.configurable))&&(i={enumerable:!0,get:function(){return e[t]}}),Object.defineProperty(n,u,i)}:function(n,e,t,u){u===void 0&&(u=t),n[u]=e[t]});h.__esModule=!0;h.getMiddlewareHandler=void 0;var W=p();L(h,W,\\"getMiddlewareHandler\\")});var K={};D(K,{default:()=>J});var B=x(j());var C=require(\\"lodash\\"),A=x(require(\\"node-fetch\\")),z=(n,e)=>(0,C.difference)(n,e),H=z;var I=(0,B.getMiddlewareHandler)(H,[]),J=I;module.exports=E(K);0&&(module.exports={});
        "
      `);
    });

    test("with verbose and debug mode in context", async () => {
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

      expect(bundledCodeLines.join("\n")).toMatchInlineSnapshot(`
        "var __create = Object.create;
        var __defProp = Object.defineProperty;
        var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
        var __getOwnPropNames = Object.getOwnPropertyNames;
        var __getProtoOf = Object.getPrototypeOf;
        var __hasOwnProp = Object.prototype.hasOwnProperty;
        var __markAsModule = (target) => __defProp(target, \\"__esModule\\", { value: true });
        var __commonJS = (cb, mod) => function __require() {
          return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
        };
        var __export = (target, all) => {
          for (var name in all)
            __defProp(target, name, { get: all[name], enumerable: true });
        };
        var __reExport = (target, module2, copyDefault, desc) => {
          if (module2 && typeof module2 === \\"object\\" || typeof module2 === \\"function\\") {
            for (let key of __getOwnPropNames(module2))
              if (!__hasOwnProp.call(target, key) && (copyDefault || key !== \\"default\\"))
                __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
          }
          return target;
        };
        var __toESM = (module2, isNodeMode) => {
          return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, \\"default\\", !isNodeMode && module2 && module2.__esModule ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
        };
        var __toCommonJS = /* @__PURE__ */ ((cache) => {
          return (module2, temp) => {
            return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
          };
        })(typeof WeakMap !== \\"undefined\\" ? /* @__PURE__ */ new WeakMap() : 0);
  
        // ../middleware/dist/cjs/middleware.js
        var require_middleware = __commonJS({
          \\"../middleware/dist/cjs/middleware.js\\"(exports) {
            \\"use strict\\";
            var __assign = exports && exports.__assign || function() {
              __assign = Object.assign || function(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                  s = arguments[i];
                  for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                      t[p] = s[p];
                }
                return t;
              };
              return __assign.apply(this, arguments);
            };
            var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
              function adopt(value) {
                return value instanceof P ? value : new P(function(resolve) {
                  resolve(value);
                });
              }
              return new (P || (P = Promise))(function(resolve, reject) {
                function fulfilled(value) {
                  try {
                    step(generator.next(value));
                  } catch (e) {
                    reject(e);
                  }
                }
                function rejected(value) {
                  try {
                    step(generator[\\"throw\\"](value));
                  } catch (e) {
                    reject(e);
                  }
                }
                function step(result) {
                  result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
                }
                step((generator = generator.apply(thisArg, _arguments || [])).next());
              });
            };
            var __generator = exports && exports.__generator || function(thisArg, body) {
              var _ = { label: 0, sent: function() {
                if (t[0] & 1)
                  throw t[1];
                return t[1];
              }, trys: [], ops: [] }, f, y, t, g;
              return g = { next: verb(0), \\"throw\\": verb(1), \\"return\\": verb(2) }, typeof Symbol === \\"function\\" && (g[Symbol.iterator] = function() {
                return this;
              }), g;
              function verb(n) {
                return function(v) {
                  return step([n, v]);
                };
              }
              function step(op) {
                if (f)
                  throw new TypeError(\\"Generator is already executing.\\");
                while (g && (g = 0, op[0] && (_ = 0)), _)
                  try {
                    if (f = 1, y && (t = op[0] & 2 ? y[\\"return\\"] : op[0] ? y[\\"throw\\"] || ((t = y[\\"return\\"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                      return t;
                    if (y = 0, t)
                      op = [op[0] & 2, t.value];
                    switch (op[0]) {
                      case 0:
                      case 1:
                        t = op;
                        break;
                      case 4:
                        _.label++;
                        return { value: op[1], done: false };
                      case 5:
                        _.label++;
                        y = op[1];
                        op = [0];
                        continue;
                      case 7:
                        op = _.ops.pop();
                        _.trys.pop();
                        continue;
                      default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                          _ = 0;
                          continue;
                        }
                        if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                          _.label = op[1];
                          break;
                        }
                        if (op[0] === 6 && _.label < t[1]) {
                          _.label = t[1];
                          t = op;
                          break;
                        }
                        if (t && _.label < t[2]) {
                          _.label = t[2];
                          _.ops.push(op);
                          break;
                        }
                        if (t[2])
                          _.ops.pop();
                        _.trys.pop();
                        continue;
                    }
                    op = body.call(thisArg, _);
                  } catch (e) {
                    op = [6, e];
                    y = 0;
                  } finally {
                    f = t = 0;
                  }
                if (op[0] & 5)
                  throw op[1];
                return { value: op[0] ? op[1] : void 0, done: true };
              }
            };
            exports.__esModule = true;
            exports.getMiddlewareHandler = exports.MiddlewareContext = void 0;
            var MiddlewareContext = function() {
              function MiddlewareContext2() {
                var _newTarget = this.constructor;
                this.context = {};
                Object.setPrototypeOf(this, _newTarget.prototype);
              }
              MiddlewareContext2.prototype.set = function(key, value) {
                this.context[key] = value;
              };
              MiddlewareContext2.prototype.get = function(key) {
                return this.context[key];
              };
              return MiddlewareContext2;
            }();
            exports.MiddlewareContext = MiddlewareContext;
            var executeLambda = function(lambda, event, context, callback) {
              return __awaiter(void 0, void 0, void 0, function() {
                var lambdaResult;
                return __generator(this, function(_a) {
                  switch (_a.label) {
                    case 0:
                      lambdaResult = lambda(event, context, callback);
                      _a.label = 1;
                    case 1:
                      if (!(typeof (lambdaResult === null || lambdaResult === void 0 ? void 0 : lambdaResult[\\"then\\"]) === \\"function\\"))
                        return [3, 3];
                      return [4, lambdaResult];
                    case 2:
                      lambdaResult = _a.sent();
                      return [3, 1];
                    case 3:
                      return [2, lambdaResult];
                  }
                });
              });
            };
            var getMiddlewareHandler2 = function(lambda, middlewares) {
              return function(event, context, _callback) {
                return __awaiter(void 0, void 0, void 0, function() {
                  var eventWithContext, step, next;
                  return __generator(this, function(_a) {
                    switch (_a.label) {
                      case 0:
                        eventWithContext = __assign(__assign({}, event), { somodMiddlewareContext: new MiddlewareContext() });
                        step = middlewares.length;
                        next = function() {
                          return __awaiter(void 0, void 0, void 0, function() {
                            var middleware, result, lambdaResult;
                            return __generator(this, function(_a2) {
                              switch (_a2.label) {
                                case 0:
                                  if (!(step > 0))
                                    return [3, 2];
                                  middleware = middlewares[--step];
                                  return [4, middleware(next, eventWithContext, context)];
                                case 1:
                                  result = _a2.sent();
                                  return [2, result];
                                case 2:
                                  return [4, executeLambda(lambda, eventWithContext, context, _callback)];
                                case 3:
                                  lambdaResult = _a2.sent();
                                  return [2, lambdaResult];
                              }
                            });
                          });
                        };
                        return [4, next()];
                      case 1:
                        return [2, _a.sent()];
                    }
                  });
                });
              };
            };
            exports.getMiddlewareHandler = getMiddlewareHandler2;
          }
        });
  
        // ../middleware/dist/cjs/index.js
        var require_cjs = __commonJS({
          \\"../middleware/dist/cjs/index.js\\"(exports) {
            \\"use strict\\";
            var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
              if (k2 === void 0)
                k2 = k;
              var desc = Object.getOwnPropertyDescriptor(m, k);
              if (!desc || (\\"get\\" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
                desc = { enumerable: true, get: function() {
                  return m[k];
                } };
              }
              Object.defineProperty(o, k2, desc);
            } : function(o, m, k, k2) {
              if (k2 === void 0)
                k2 = k;
              o[k2] = m[k];
            });
            exports.__esModule = true;
            exports.getMiddlewareHandler = void 0;
            var middleware_1 = require_middleware();
            __createBinding(exports, middleware_1, \\"getMiddlewareHandler\\");
          }
        });
  
  
        var f1_exports = {};
        __export(f1_exports, {
          default: () => f1_default2
        });
        var import_somod_middleware = __toESM(require_cjs());
  
  
        var a = 10;
        var f1_default = a;
  
  
        var handler = (0, import_somod_middleware.getMiddlewareHandler)(f1_default, []);
        var f1_default2 = handler;
        module.exports = __toCommonJS(f1_exports);
        // Annotate the CommonJS export names for ESM import in node:
        0 && (module.exports = {});
        "
      `);
      expect(
        bundledFunctionSegments[1].startsWith(
          "=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vL"
        )
      ).toBeTruthy();
    });
  }
});
