import { copyCommonLib, createFiles, createTempDir, deleteDir } from "../utils";
import { bundle, packageLambda } from "../../src/utils/packageLambda";
import { join } from "path";
import { readFile } from "fs/promises";
import { existsSync } from "fs";

const generatePaths = (dir: string, module: string, functionName: string) => {
  const file = `.slp/functions/${module}/${functionName}.js`;
  const sourceFilePath = join(dir, file);
  const outDir = join(dir, `.slp/lambdas/${module}/${functionName}`);
  const outFile = join(outDir, "index.js");
  const outSourceMapFile = join(outDir, "index.js.map");

  return { file, sourceFilePath, outDir, outFile, outSourceMapFile };
};

describe("Test util packageLambda.bundle", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "slp");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for empty file", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "a", "b");
    createFiles(dir, { [file]: "" });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      "//# sourceMappingURL=index.js.map\n"
    );
    await expect(
      readFile(outSourceMapFile, { encoding: "utf8" })
    ).resolves.toEqual(
      JSON.stringify(
        {
          version: 3,
          sources: [],
          sourcesContent: [],
          mappings: "",
          names: []
        },
        null,
        2
      ) + "\n"
    );
  });

  test("for simple file", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "a", "b");
    createFiles(dir, { [file]: "console.log(1)" });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      "console.log(1);\n//# sourceMappingURL=index.js.map\n"
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: ["../../../functions/a/b.js"],
      sourcesContent: ["console.log(1)"],
      mappings: "AAAA,QAAQ,IAAI",
      names: []
    });
  });

  test("for no sourceMap", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "a", "b");
    createFiles(dir, { [file]: "console.log(1)" });
    await expect(
      bundle(dir, outDir, sourceFilePath)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      "console.log(1);\n"
    );
    expect(existsSync(outSourceMapFile)).not.toBeTruthy();
  });

  test("for export from root module", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "sample", "b");
    createFiles(dir, {
      [file]: 'export { b as default } from "../../../build";',
      "build/index.js": "export const b = 10;",
      "package.json": JSON.stringify({ name: "sample", version: "1.0.0" })
    });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var e=Object.defineProperty;var a=o=>e(o,"__esModule",{value:!0});var f=typeof require!="undefined"?require:o=>{throw new Error(\'Dynamic require of "\'+o+\'" is not supported\')};var d=(o,t)=>{a(o);for(var b in t)e(o,b,{get:t[b],enumerable:!0})};d(exports,{default:()=>r});var r=10;0&&(module.exports={});\n//# sourceMappingURL=index.js.map\n'
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: ["../../../functions/sample/b.js", "../../../../build/index.js"],
      sourcesContent: [
        'export { b as default } from "../../../build";',
        "export const b = 10;"
      ],
      mappings: "mPAAA,2BCAO,GAAM,GAAI",
      names: []
    });
  });

  test("for export from 1 level dependent module", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "dependency1", "b");
    createFiles(dir, {
      [file]: 'export { b as default } from "dependency1";',
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/build/index.js": "export const b = 10;",
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var d=Object.defineProperty;var p=e=>d(e,"__esModule",{value:!0});var a=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var r=(e,o)=>{p(e);for(var t in o)d(e,t,{get:o[t],enumerable:!0})};r(exports,{default:()=>n});var n=10;0&&(module.exports={});\n//# sourceMappingURL=index.js.map\n'
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: [
        "../../../functions/dependency1/b.js",
        "../../../../node_modules/dependency1/build/index.js"
      ],
      sourcesContent: [
        'export { b as default } from "dependency1";',
        "export const b = 10;"
      ],
      mappings: "mPAAA,2BCAO,GAAM,GAAI",
      names: []
    });
  });

  test("for export from 2 level dependent module", async () => {
    // Validate the Assumption that all modules are installed at ./node_modules
    // In Production all modules are direct dependencies of root module
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "dependency2", "b");
    createFiles(dir, {
      [file]: 'export { b as default } from "dependency2";',
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false,
        dependencies: { dependency2: "^1.0.0" }
      }),
      "node_modules/dependency2/build/index.js": "export const b = 10;",
      "node_modules/dependency2/package.json": JSON.stringify({
        name: "dependency2",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var d=Object.defineProperty;var p=e=>d(e,"__esModule",{value:!0});var a=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var r=(e,o)=>{p(e);for(var t in o)d(e,t,{get:o[t],enumerable:!0})};r(exports,{default:()=>n});var n=10;0&&(module.exports={});\n//# sourceMappingURL=index.js.map\n'
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: [
        "../../../functions/dependency2/b.js",
        "../../../../node_modules/dependency2/build/index.js"
      ],
      sourcesContent: [
        'export { b as default } from "dependency2";',
        "export const b = 10;"
      ],
      mappings: "mPAAA,2BCAO,GAAM,GAAI",
      names: []
    });
  });

  test("for export treeshaking from root module", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "sample", "b");
    createFiles(dir, {
      [file]: 'export { b as default } from "../../../build";',
      "build/index.js": "export const b = 10;\nexport const c = 20;",
      "package.json": JSON.stringify({ name: "sample", version: "1.0.0" })
    });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var r=Object.defineProperty;var c=o=>r(o,"__esModule",{value:!0});var s=typeof require!="undefined"?require:o=>{throw new Error(\'Dynamic require of "\'+o+\'" is not supported\')};var p=(o,t)=>{c(o);for(var e in t)r(o,e,{get:t[e],enumerable:!0})};p(exports,{default:()=>b});var b=10;0&&(module.exports={});\n//# sourceMappingURL=index.js.map\n'
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: ["../../../functions/sample/b.js", "../../../../build/index.js"],
      sourcesContent: [
        'export { b as default } from "../../../build";',
        "export const b = 10;\nexport const c = 20;"
      ],
      mappings: "mPAAA,2BCAO,GAAM,GAAI",
      names: []
    });
  });

  test("for export treeshaking from 1 level dependent module", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "dependency1", "b");
    createFiles(dir, {
      [file]: 'export { b as default } from "dependency1";',
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/build/index.js":
        "export const b = 10;\nexport const c = 20;",
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var c=Object.defineProperty;var p=e=>c(e,"__esModule",{value:!0});var d=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var r=(e,o)=>{p(e);for(var t in o)c(e,t,{get:o[t],enumerable:!0})};r(exports,{default:()=>n});var n=10;0&&(module.exports={});\n//# sourceMappingURL=index.js.map\n'
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: [
        "../../../functions/dependency1/b.js",
        "../../../../node_modules/dependency1/build/index.js"
      ],
      sourcesContent: [
        'export { b as default } from "dependency1";',
        "export const b = 10;\nexport const c = 20;"
      ],
      mappings: "mPAAA,2BCAO,GAAM,GAAI",
      names: []
    });
  });

  test("for export treeshaking from 2 level dependent module", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "dependency2", "b");
    createFiles(dir, {
      [file]: 'export { b as default } from "dependency2";',
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false,
        dependencies: { dependency2: "^1.0.0" }
      }),
      "node_modules/dependency2/build/index.js":
        "export const b = 10;\nexport const c = 20;",
      "node_modules/dependency2/package.json": JSON.stringify({
        name: "dependency2",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var c=Object.defineProperty;var p=e=>c(e,"__esModule",{value:!0});var d=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var r=(e,o)=>{p(e);for(var t in o)c(e,t,{get:o[t],enumerable:!0})};r(exports,{default:()=>n});var n=10;0&&(module.exports={});\n//# sourceMappingURL=index.js.map\n'
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: [
        "../../../functions/dependency2/b.js",
        "../../../../node_modules/dependency2/build/index.js"
      ],
      sourcesContent: [
        'export { b as default } from "dependency2";',
        "export const b = 10;\nexport const c = 20;"
      ],
      mappings: "mPAAA,2BCAO,GAAM,GAAI",
      names: []
    });
  });

  test("for export treeshaking from 2 level dependent module with exportAllDeclaration in middle", async () => {
    const { file, sourceFilePath, outDir, outFile, outSourceMapFile } =
      generatePaths(dir, "dependency1", "b");
    createFiles(dir, {
      [file]: 'export { b as default } from "dependency1";',
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/build/index.js": 'export * from "dependency2";',
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false,
        dependencies: { dependency2: "^1.0.0" }
      }),
      "node_modules/dependency2/build/index.js":
        "export const b = 10;\nexport const c = 20;",
      "node_modules/dependency2/package.json": JSON.stringify({
        name: "dependency2",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(
      bundle(dir, outDir, sourceFilePath, [], true)
    ).resolves.not.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var c=Object.defineProperty;var p=e=>c(e,"__esModule",{value:!0});var d=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var r=(e,o)=>{p(e);for(var t in o)c(e,t,{get:o[t],enumerable:!0})};r(exports,{default:()=>n});var n=10;0&&(module.exports={});\n//# sourceMappingURL=index.js.map\n'
    );
    const sourceMapContent = await readFile(outSourceMapFile, {
      encoding: "utf8"
    });
    const sourceMap = JSON.parse(sourceMapContent);
    expect(sourceMap).toEqual({
      version: 3,
      sources: [
        "../../../functions/dependency1/b.js",
        "../../../../node_modules/dependency2/build/index.js"
      ],
      sourcesContent: [
        'export { b as default } from "dependency1";',
        "export const b = 10;\nexport const c = 20;"
      ],
      mappings: "mPAAA,2BCAO,GAAM,GAAI",
      names: []
    });
  });
});

describe("Test util packageLambda.packageLambda", () => {
  let dir: string = null;

  beforeEach(async () => {
    dir = createTempDir();
    await copyCommonLib(dir, "common");
    await copyCommonLib(dir, "slp");
  });

  afterEach(() => {
    deleteDir(dir);
  });

  test("for valid function", async () => {
    const { file, sourceFilePath, outDir, outFile } = generatePaths(
      dir,
      "dependency2",
      "b"
    );
    createFiles(dir, {
      [file]: 'export { b as default } from "dependency2";',
      ".slp/lambdaBundleExclude.json": JSON.stringify({
        dependency2: { b: ["excluded_module"] }
      }),
      "package.json": JSON.stringify({
        name: "sample",
        version: "1.0.0",
        dependencies: { dependency1: "^1.0.0" }
      }),
      "node_modules/dependency1/package.json": JSON.stringify({
        name: "dependency1",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false,
        dependencies: { dependency2: "^1.0.0" }
      }),
      "node_modules/dependency2/build/serverless/functions/b.js":
        'import aws from "aws-sdk";\nimport exluded from "excluded_module";\nconst b = 10;\nexport const c = 20;\nexport default b;',
      "node_modules/dependency2/build/serverless/functionIndex.js":
        'export { default as b } from "./functions/b"',
      "node_modules/dependency2/build/index.js":
        'export * from "./serverless/functionIndex.js"',
      "node_modules/dependency2/package.json": JSON.stringify({
        name: "dependency2",
        version: "1.0.0",
        module: "./build/index.js",
        sideEffects: false
      })
    });
    await expect(packageLambda(dir, sourceFilePath)).resolves.toBeUndefined();
    await expect(readFile(outFile, { encoding: "utf8" })).resolves.toEqual(
      'var m=Object.create;var r=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var u=Object.getOwnPropertyNames;var c=Object.getPrototypeOf,l=Object.prototype.hasOwnProperty;var s=e=>r(e,"__esModule",{value:!0});var i=typeof require!="undefined"?require:e=>{throw new Error(\'Dynamic require of "\'+e+\'" is not supported\')};var n=(e,o)=>{s(e);for(var t in o)r(e,t,{get:o[t],enumerable:!0})},x=(e,o,t)=>{if(o&&typeof o=="object"||typeof o=="function")for(let d of u(o))!l.call(e,d)&&d!=="default"&&r(e,d,{get:()=>o[d],enumerable:!(t=p(o,d))||t.enumerable});return e},a=e=>x(s(r(e!=null?m(c(e)):{},"default",e&&e.__esModule&&"default"in e?{get:()=>e.default,enumerable:!0}:{value:e,enumerable:!0})),e);n(exports,{default:()=>f});var k=a(require("aws-sdk")),_=a(require("excluded_module")),b=10;var f=b;0&&(module.exports={});\n'
    );
    const outPackageJsonContent = await readFile(join(outDir, "package.json"), {
      encoding: "utf8"
    });
    expect(JSON.parse(outPackageJsonContent)).toEqual({
      name: "dependency2-b",
      version: "1.0.0",
      description:
        "AWS Lambda function, auto created from b function in dependency2 module"
    });
  });
});
