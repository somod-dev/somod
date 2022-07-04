/* eslint-disable */

const { build } = require("esbuild");
const { readFileSync, writeFileSync, rmSync } = require("fs");
const { join } = require("path");

const source =
  "src/utils/serverless/baseModule/parameter/customResourceLambda.ts";
const intermediate =
  "dist/utils/serverless/baseModule/parameter/customResourceLambda.min.js";
const target = "dist/utils/serverless/baseModule/parameter/getLambdaCode.js";

build({
  entryPoints: [join(__dirname, source)],
  bundle: true,
  outfile: join(__dirname, intermediate),
  platform: "node",
  external: ["@solib/lambda-event-cfn-custom-resource", "lodash", "tslib"],
  minify: true,
  target: ["node16"]
}).then(() => {
  const customResourceLambdaContent = readFileSync(
    join(__dirname, intermediate),
    { encoding: "utf8" }
  );

  writeFileSync(
    join(__dirname, target),
    "export var lambdaCode = " +
      JSON.stringify(customResourceLambdaContent) +
      ";"
  );

  rmSync(join(__dirname, intermediate));
});
