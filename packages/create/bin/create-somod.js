#!/usr/bin/env node
/* eslint-disable */
process.env.CREATE_SOMOD_CLI_PATH = require("path").dirname(__dirname);

require("cli-opentelemetry").tele(
  "create-somod",
  require("path").join(__dirname, "../dist/index.js"),
  "VERSION",
  "OTLP_URL",
  {
    // prettier-ignore
    "OTLP_KEY_NAME": "OTLP_KEY_VALUE"
  },
  3 * 60 * 1000 // 3 minutes
);
