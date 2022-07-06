#!/usr/bin/env node
/* eslint-disable */
require("@solib/cli-open-telemetry").tele(
  "slp",
  require("path").join(__dirname, "../dist/index.js"),
  "OTLP_URL",
  {
    // prettier-ignore
    "OTLP_KEY_NAME": "OTLP_KEY_VALUE"
  }
);
