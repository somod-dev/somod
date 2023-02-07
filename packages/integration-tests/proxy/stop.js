/* eslint-disable */
const { readFile } = require("fs");
const { join } = require("path");
const { exec } = require("child_process");

readFile(join(__dirname, "pid"), "utf8", (err, pid) => {
  exec("kill -9 " + pid, err => {
    if (err) {
      console.error(err);
      process.exitCode = 1;
    }
  });
});
