#!/usr/bin/env node
/* eslint-disable */
require("cli-opentelemetry").tele(
  "somod",
  require("path").join(__dirname, "../dist/index.js"),
  "VERSION",
  "OTLP_URL",
  {
    // prettier-ignore
    "OTLP_KEY_NAME": "OTLP_KEY_VALUE"
  },
  2 * 60 * 1000 // 2 minutes
);
