/* eslint-disable */

const [p, f, packageJsonFile, version] = process.argv;

const update = async () => {
  const packageJsonStr = await require("fs/promises").readFile(
    packageJsonFile,
    {
      encoding: "utf8"
    }
  );

  const packageJson = JSON.parse(packageJsonStr);

  packageJson.version = version;
  packageJson.dependencies["@somod/somod"] = version;

  await require("fs/promises").writeFile(
    packageJsonFile,
    JSON.stringify(packageJson, null, 2) + "\n"
  );
};

update().then(
  () => {
    console.log("package.json is updated");
  },
  e => {
    console.error(e);
    process.exit(1);
  }
);
