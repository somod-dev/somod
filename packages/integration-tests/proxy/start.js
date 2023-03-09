/* eslint-disable */
const { spawn } = require("child_process");
const { join } = require("path");
const { writeFile } = require("fs");

const proxyServer = spawn(process.argv[0], [join(__dirname, "npm-proxy.js")], {
  detached: true,
  stdio: "ignore"
});

writeFile(join(__dirname, "pid"), proxyServer.pid + "", () => {
  // don't do anything
});

proxyServer.unref();
