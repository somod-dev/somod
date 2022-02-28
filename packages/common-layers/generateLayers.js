/* eslint-disable */

const { generate } = require("./dist/utils");

generate().then(
  () => {},
  e => {
    console.error(e);
    process.exit(1);
  }
);
