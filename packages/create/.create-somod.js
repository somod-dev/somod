/* eslint-disable */

const { join } = require("path");
const { readFile } = require("fs/promises");

async function loadFile(files, file, binary = false) {
  files[file] = await readFile(
    join(__dirname, "template", file),
    binary ? undefined : "utf8"
  );
}

/**
 * @type {import("./src/config").GetConfig}
 */
module.exports = async mode => {
  const ignoreList = ["node_modules", "/build", "/parameters.json", ".somod"];

  const defaultCompilerOptions = {
    allowUmdGlobalAccess: true,
    outDir: "build",
    declaration: true,
    target: "ES5",
    module: "ES6",
    rootDir: "./",
    lib: ["ESNext", "DOM", "DOM.Iterable"],
    moduleResolution: "Node",
    esModuleInterop: true,
    importHelpers: true,
    skipLibCheck: true
  };
  const defaultInclude = ["lib"];
  const defaultExclude = [];

  const files = {};

  await loadFile(files, "lib/index.ts");

  if (mode == "ALL" || mode == "UI") {
    ignoreList.push(
      ".next",
      "tsconfig.json",
      "/pages",
      "/public",
      "next-env.d.ts",
      ".env",
      "next.config.js"
    );
    defaultCompilerOptions.jsx = "react";
    defaultInclude.push("ui");

    await loadFile(files, "ui/pages/_document.tsx");
    await loadFile(files, "ui/pages/index.tsx");
    await loadFile(files, "ui/public/favicon.ico", true);
    await loadFile(files, "ui/config.yaml");
    await loadFile(files, "parameters.yaml");
    await loadFile(files, "tsconfig.json");
  }

  if (mode == "ALL" || mode == "SERVERLESS") {
    ignoreList.push(".aws-sam", "samconfig.toml", "/template.yaml");
    defaultInclude.push("serverless");

    await loadFile(files, "serverless/template.yaml");
  }

  return {
    somodName: "somod",
    somodVersion: "^1.14.0",
    ignorePaths: {
      git: ignoreList,
      prettier: [...ignoreList, "tsconfig.somod.json"],
      eslint: ignoreList
    },
    tsConfig: {
      compilerOptions: defaultCompilerOptions,
      include: defaultInclude,
      exclude: defaultExclude
    },
    files,
    dependencies: {
      dev: ["@types/node"]
    }
  };
};
