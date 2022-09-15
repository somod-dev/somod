/* eslint-disable */
const { getCompiledValidator } = require("decorated-ajv");

const { writeFileSync, mkdirSync } = require("fs");

const { join } = require("path");
const { exit } = require("process");

const compiledDirectory = join(__dirname, "../compiled");
mkdirSync(compiledDirectory, { recursive: true });

function compile(type) {
  const schema = require("../schemas/" + type + "/index.json");
  return new Promise((resolve, reject) => {
    getCompiledValidator(schema).then(compiledSchema => {
      writeFileSync(join(compiledDirectory, type + ".js"), compiledSchema);
      resolve();
    }, reject);
  });
}

Promise.all([
  compile("parameters"),
  compile("serverless-template"),
  compile("ui-config")
]).then(
  () => {
    // do nothing
  },
  e => {
    console.error(e);
    exit(1);
  }
);
