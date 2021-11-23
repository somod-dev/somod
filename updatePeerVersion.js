/* eslint-disable */
const { readdir, readFile, writeFile } = require("fs/promises");
const { join } = require("path");

const updatePeer = async dir => {
  const path_packages = "packages";
  const file_packageJson = "package.json";
  const packages = await readdir(join(dir, path_packages));
  const packageInfo = {};
  await Promise.all(
    packages.map(async packageDirName => {
      const packageJsonStr = await readFile(
        join(dir, path_packages, packageDirName, file_packageJson),
        { encoding: "utf8" }
      );

      const packageJson = JSON.parse(packageJsonStr);
      const packageName = packageJson.name;
      packageInfo[packageName] = { packageDirName, packageJson };
    })
  );

  Object.keys(packageInfo).forEach(packageName => {
    const { packageJson } = packageInfo[packageName];
    if (packageJson.peerDependencies) {
      Object.keys(packageJson.peerDependencies).forEach(peerDependency => {
        if (packageInfo[peerDependency]) {
          packageJson.peerDependencies[peerDependency] =
            "^" + packageInfo[peerDependency].packageJson.version;
        }
      });
    }
  });

  await Promise.all(
    Object.keys(packageInfo).map(async packageName => {
      const { packageDirName, packageJson } = packageInfo[packageName];
      await writeFile(
        join(dir, path_packages, packageDirName, file_packageJson),
        JSON.stringify(packageJson, null, 2) + "\n"
      );
    })
  );
};

updatePeer(__dirname).then(() => {
  console.log("Updated Peer");
});
