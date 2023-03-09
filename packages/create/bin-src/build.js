/* eslint-disable */
const { join, dirname } = require("path");
const { mkdir, writeFile, chmod } = require("fs/promises");

const template = `#!/usr/bin/env node
/* eslint-disable */
process.env.CREATE_SOMOD_CLI_PATH = require("path").dirname(__dirname);

require("cli-opentelemetry").tele(
  "create-somod",
  require("path").join(__dirname, "../dist/index.js"),
  "${process.env.GITHUB_REF_NAME || ""}",
  "${process.env.OTLP_URL || ""}",
  { "${process.env.OTLP_KEY_NAME || ""}": "${
  process.env.OTLP_KEY_VALUE || ""
}" },
  3 * 60 * 1000 // 3 minutes
);
`;

async function build() {
  const binFilePath = join(__dirname, "../bin/create-somod.js");
  await mkdir(dirname(binFilePath), { recursive: true });
  await writeFile(binFilePath, template);
  await chmod(binFilePath, 0755);
}

build();
