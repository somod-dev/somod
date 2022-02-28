/* eslint-disable */

const { removeBaseLayerLibraries } = require("./dist/utils");

removeBaseLayerLibraries(process.argv[2]).then(
  () => {},
  e => {
    console.error(e);
    process.exit(1);
  }
);
