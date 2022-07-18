/* eslint-disable */

const { exit } = require("process");

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
  packageJson.dependencies["@sodev/sodev"] = "1.3.1"; // TODO: this must match the @sodev/sodev in peerDependency of @somod/somod

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
