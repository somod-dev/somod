/* eslint-disable */
const { join, dirname } = require("path");
const { mkdir, writeFile, chmod } = require("fs/promises");

const template = `#!/usr/bin/env node
/* eslint-disable */
require("cli-opentelemetry").tele(
  "somod",
  require("path").join(__dirname, "../dist/index.js"),
  "${process.env.GITHUB_REF_NAME || ""}",
  "${process.env.OTLP_URL || ""}",
  { "${process.env.OTLP_KEY_NAME || ""}": "${
  process.env.OTLP_KEY_VALUE || ""
}" },
  2 * 60 * 1000 // 2 minutes
);
`;

async function build() {
  const binFilePath = join(__dirname, "../bin/somod.js");
  await mkdir(dirname(binFilePath), { recursive: true });
  await writeFile(binFilePath, template);
  await chmod(binFilePath, 0755);
}

build();
