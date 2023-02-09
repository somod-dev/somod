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

  test("with functions having unresolved dependencies", async () => {
    createFiles(dir, {
      "build/serverless/functions/f1.js": 'export {default} from "node-fetch"',
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
      message: expect.stringContaining('ERROR: Could not resolve "node-fetch"')
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
                module: { name: "m1", version: "v1.0.0", packageLocation: dir },
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
      import MMMm2MMMmiddleware1 from \\"../../../../node_modules/m2/build/serverless/functions/middlewares/middleware1\\";
      const handler = getMiddlewareHandler(lambdaFn, [MMMm2MMMmiddleware1]);
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
      readFile(join(dir, ".somod/serverless/functions/m1/f1/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
      "var v=Object.defineProperty;var g=Object.getOwnPropertyDescriptor;var p=Object.getOwnPropertyNames;var M=Object.prototype.hasOwnProperty;var _=a=>v(a,\\"__esModule\\",{value:!0});var O=(a,r)=>{for(var t in r)v(a,t,{get:r[t],enumerable:!0})},k=(a,r,t,u)=>{if(r&&typeof r==\\"object\\"||typeof r==\\"function\\")for(let i of p(r))!M.call(a,i)&&(t||i!==\\"default\\")&&v(a,i,{get:()=>r[i],enumerable:!(u=g(r,i))||u.enumerable});return a};var C=(a=>(r,t)=>a&&a.get(r)||(t=k(_({}),r,1),a&&a.set(r,t),t))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var E={};O(E,{default:()=>T});var d=function(){return d=Object.assign||function(a){for(var r,t=1,u=arguments.length;t<u;t++){r=arguments[t];for(var i in r)Object.prototype.hasOwnProperty.call(r,i)&&(a[i]=r[i])}return a},d.apply(this,arguments)},w=function(a,r,t,u){function i(e){return e instanceof t?e:new t(function(o){o(e)})}return new(t||(t=Promise))(function(e,o){function l(c){try{n(u.next(c))}catch(f){o(f)}}function s(c){try{n(u.throw(c))}catch(f){o(f)}}function n(c){c.done?e(c.value):i(c.value).then(l,s)}n((u=u.apply(a,r||[])).next())})},b=function(a,r){var t={label:0,sent:function(){if(e[0]&1)throw e[1];return e[1]},trys:[],ops:[]},u,i,e,o;return o={next:l(0),throw:l(1),return:l(2)},typeof Symbol==\\"function\\"&&(o[Symbol.iterator]=function(){return this}),o;function l(n){return function(c){return s([n,c])}}function s(n){if(u)throw new TypeError(\\"Generator is already executing.\\");for(;o&&(o=0,n[0]&&(t=0)),t;)try{if(u=1,i&&(e=n[0]&2?i.return:n[0]?i.throw||((e=i.return)&&e.call(i),0):i.next)&&!(e=e.call(i,n[1])).done)return e;switch(i=0,e&&(n=[n[0]&2,e.value]),n[0]){case 0:case 1:e=n;break;case 4:return t.label++,{value:n[1],done:!1};case 5:t.label++,i=n[1],n=[0];continue;case 7:n=t.ops.pop(),t.trys.pop();continue;default:if(e=t.trys,!(e=e.length>0&&e[e.length-1])&&(n[0]===6||n[0]===2)){t=0;continue}if(n[0]===3&&(!e||n[1]>e[0]&&n[1]<e[3])){t.label=n[1];break}if(n[0]===6&&t.label<e[1]){t.label=e[1],e=n;break}if(e&&t.label<e[2]){t.label=e[2],t.ops.push(n);break}e[2]&&t.ops.pop(),t.trys.pop();continue}n=r.call(a,t)}catch(c){n=[6,c],i=0}finally{u=e=0}if(n[0]&5)throw n[1];return{value:n[0]?n[1]:void 0,done:!0}}},j=function(){function a(){var r=this.constructor;this.context={},Object.setPrototypeOf(this,r.prototype)}return a.prototype.set=function(r,t){this.context[r]=t},a.prototype.get=function(r){return this.context[r]},a}();var H=function(a,r,t,u){return w(void 0,void 0,void 0,function(){var i;return b(this,function(e){switch(e.label){case 0:i=a(r,t,u),e.label=1;case 1:return typeof i.then!=\\"function\\"?[3,3]:[4,i];case 2:return i=e.sent(),[3,1];case 3:return[2,i]}})})},y=function(a,r){return function(t,u,i){return w(void 0,void 0,void 0,function(){var e,o,l;return b(this,function(s){switch(s.label){case 0:return e=d(d({},t),{somodMiddlewareContext:new j}),o=r.length,l=function(){return w(void 0,void 0,void 0,function(){var n,c,f;return b(this,function(h){switch(h.label){case 0:return o>0?(n=r[--o],[4,n(l,e,u)]):[3,2];case 1:return c=h.sent(),[2,c];case 2:return[4,H(a,e,u,i)];case 3:return f=h.sent(),[2,f]}})})},[4,l()];case 1:return[2,s.sent()]}})})}};var m=10;var R=(a,r,t)=>a(),x=R;var S=y(m,[x]),T=S;module.exports=C(E);0&&(module.exports={});
      "
    `);
    await expect(
      readFile(join(dir, ".somod/serverless/functions/m1/f2/index.js"), "utf8")
    ).resolves.toMatchInlineSnapshot(`
      "var _=Object.create;var d=Object.defineProperty;var M=Object.getOwnPropertyDescriptor;var O=Object.getOwnPropertyNames;var k=Object.getPrototypeOf,C=Object.prototype.hasOwnProperty;var m=n=>d(n,\\"__esModule\\",{value:!0});var j=(n,r)=>{for(var e in r)d(n,e,{get:r[e],enumerable:!0})},x=(n,r,e,u)=>{if(r&&typeof r==\\"object\\"||typeof r==\\"function\\")for(let a of O(r))!C.call(n,a)&&(e||a!==\\"default\\")&&d(n,a,{get:()=>r[a],enumerable:!(u=M(r,a))||u.enumerable});return n},H=(n,r)=>x(m(d(n!=null?_(k(n)):{},\\"default\\",!r&&n&&n.__esModule?{get:()=>n.default,enumerable:!0}:{value:n,enumerable:!0})),n),R=(n=>(r,e)=>n&&n.get(r)||(e=x(m({}),r,1),n&&n.set(r,e),e))(typeof WeakMap!=\\"undefined\\"?new WeakMap:0);var W={};j(W,{default:()=>L});var h=function(){return h=Object.assign||function(n){for(var r,e=1,u=arguments.length;e<u;e++){r=arguments[e];for(var a in r)Object.prototype.hasOwnProperty.call(r,a)&&(n[a]=r[a])}return n},h.apply(this,arguments)},b=function(n,r,e,u){function a(t){return t instanceof e?t:new e(function(o){o(t)})}return new(e||(e=Promise))(function(t,o){function s(c){try{i(u.next(c))}catch(l){o(l)}}function f(c){try{i(u.throw(c))}catch(l){o(l)}}function i(c){c.done?t(c.value):a(c.value).then(s,f)}i((u=u.apply(n,r||[])).next())})},w=function(n,r){var e={label:0,sent:function(){if(t[0]&1)throw t[1];return t[1]},trys:[],ops:[]},u,a,t,o;return o={next:s(0),throw:s(1),return:s(2)},typeof Symbol==\\"function\\"&&(o[Symbol.iterator]=function(){return this}),o;function s(i){return function(c){return f([i,c])}}function f(i){if(u)throw new TypeError(\\"Generator is already executing.\\");for(;o&&(o=0,i[0]&&(e=0)),e;)try{if(u=1,a&&(t=i[0]&2?a.return:i[0]?a.throw||((t=a.return)&&t.call(a),0):a.next)&&!(t=t.call(a,i[1])).done)return t;switch(a=0,t&&(i=[i[0]&2,t.value]),i[0]){case 0:case 1:t=i;break;case 4:return e.label++,{value:i[1],done:!1};case 5:e.label++,a=i[1],i=[0];continue;case 7:i=e.ops.pop(),e.trys.pop();continue;default:if(t=e.trys,!(t=t.length>0&&t[t.length-1])&&(i[0]===6||i[0]===2)){e=0;continue}if(i[0]===3&&(!t||i[1]>t[0]&&i[1]<t[3])){e.label=i[1];break}if(i[0]===6&&e.label<t[1]){e.label=t[1],t=i;break}if(t&&e.label<t[2]){e.label=t[2],e.ops.push(i);break}t[2]&&e.ops.pop(),e.trys.pop();continue}i=r.call(n,e)}catch(c){i=[6,c],a=0}finally{u=t=0}if(i[0]&5)throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}},S=function(){function n(){var r=this.constructor;this.context={},Object.setPrototypeOf(this,r.prototype)}return n.prototype.set=function(r,e){this.context[r]=e},n.prototype.get=function(r){return this.context[r]},n}();var T=function(n,r,e,u){return b(void 0,void 0,void 0,function(){var a;return w(this,function(t){switch(t.label){case 0:a=n(r,e,u),t.label=1;case 1:return typeof a.then!=\\"function\\"?[3,3]:[4,a];case 2:return a=t.sent(),[3,1];case 3:return[2,a]}})})},y=function(n,r){return function(e,u,a){return b(void 0,void 0,void 0,function(){var t,o,s;return w(this,function(f){switch(f.label){case 0:return t=h(h({},e),{somodMiddlewareContext:new S}),o=r.length,s=function(){return b(void 0,void 0,void 0,function(){var i,c,l;return w(this,function(v){switch(v.label){case 0:return o>0?(i=r[--o],[4,i(s,t,u)]):[3,2];case 1:return c=v.sent(),[2,c];case 2:return[4,T(n,t,u,a)];case 3:return l=v.sent(),[2,l]}})})},[4,s()];case 1:return[2,f.sent()]}})})}};var g=require(\\"lodash\\"),F=H(require(\\"node-fetch\\")),E=(n,r)=>(0,g.difference)(n,r),p=E;var G=y(p,[]),L=G;module.exports=R(W);0&&(module.exports={});
      "
    `);
  });
});
