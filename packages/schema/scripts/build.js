/* eslint-disable */
const { getCompiledValidator } = require("decorated-ajv");

const { writeFileSync, mkdirSync } = require("fs");

const { join } = require("path");

const schemasDirectory = join(__dirname, "../schemas");
mkdirSync(schemasDirectory, { recursive: true });

function build(type) {
  const schema = require("../dist/cjs/" + type + "/index");
  mkdirSync(join(schemasDirectory, type), { recursive: true });
  writeFileSync(
    join(schemasDirectory, type, "index.json"),
    JSON.stringify(schema.default, null, 2)
  );
}

build("parameters");
build("serverless-template");
build("ui-config");
