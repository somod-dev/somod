/* eslint-disable */
const { exec } = require("child_process");
const { readFile, mkdir, writeFile } = require("fs/promises");
const { createServer, IncomingMessage, ServerResponse } = require("http");
const { request } = require("https");
const { join } = require("path");

const PORT = process.env.PORT || 8000;

const packageMap = {
  "create-somod": "../../create",
  somod: "../../somod",
  "somod-middleware": "../../middleware",
  "somod-schema": "../../schema",
  "somod-types": "../../types",
  "push-notification-service": "../samples/push-notification-service",
  "push-notification-ui": "../samples/push-notification-ui"
};

const packagesDir = join(__dirname, "../packages");

const savePackageMetadata = async packResultStr => {
  const packResult = JSON.parse(packResultStr);
  const metaDataFilePath =
    packResult[0].name + "-" + packResult[0].version + ".json";
  await writeFile(
    join(packagesDir, metaDataFilePath),
    JSON.stringify(packResult[0], null, 2)
  );
};

const createPackage = sourceLocation => {
  return new Promise((resolve, reject) => {
    exec(
      "npm pack --silent --json --pack-destination " + packagesDir,
      { cwd: sourceLocation },
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          savePackageMetadata(stdout).then(resolve, resolve);
        }
      }
    );
  });
};

const createPackages = async () => {
  await mkdir(packagesDir, { recursive: true });
  await Promise.all(
    Object.values(packageMap).map(packageLocation =>
      createPackage(join(__dirname, packageLocation))
    )
  );
};

const getManifest = async packageName => {
  const packageJsonPath = join(
    __dirname,
    packageMap[packageName],
    "package.json"
  );

  const packageJsonContent = await readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonContent);

  const packageMetaContent = await readFile(
    join(packagesDir, packageName + "-" + packageJson.version + ".json"),
    "utf8"
  );
  const packageMeta = JSON.parse(packageMetaContent);

  const result = {
    _id: packageName,
    _rev: "1-" + packageMeta.shasum,
    "dist-tags": { latest: packageJson.version },
    versions: {
      [packageJson.version]: {
        _id: packageJson.name + "@" + packageJson.version,
        _nodeVersion: "16.17.1",
        _npmVersion: "8.15.0",
        dist: {
          tarball: `http://localhost:${PORT}/${packageName}/-/${packageName}-${packageJson.version}.tgz`,
          fileCount: packageMeta.entryCount,
          integrity: packageMeta.integrity,
          unpackedSize: packageMeta.unpackedSize
        }
      }
    }
  };
  Object.assign(result.versions[packageJson.version], packageJson);
  Object.assign(result, packageJson);
  return result;
};

const getTarball = async tarballName => {
  const tarballPath = join(__dirname, "../packages", tarballName);
  return await readFile(tarballPath);
};

/**
 *
 * @param {IncomingMessage} req
 * @param {ServerResponse} res
 */
const forward = (req, res) => {
  const url = new URL(req.url, "https://registry.npmjs.org");

  const targetUrl = url.toString();
  const targetHeaders = Object.assign({}, req.headers);
  targetHeaders.host = "registry.npmjs.org";

  //console.log("forwarding to " + targetUrl);

  const forwardReq = request(
    targetUrl,
    { headers: targetHeaders },
    forwardRes => {
      res.statusCode = forwardRes.statusCode;
      res.statusMessage = forwardRes.statusMessage;
      forwardRes.pipe(res);
    }
  );
  forwardReq.on("error", e => {
    console.error(e);
  });
  req.pipe(forwardReq);
};

const server = createServer((req, res) => {
  try {
    console.log(req.method, req.url);

    const urlSegments = req.url.split("/");

    if (
      req.method == "GET" &&
      urlSegments.length == 2 &&
      packageMap[urlSegments[1]]
    ) {
      //console.log("Get manifest for " + urlSegments[1]);
      getManifest(urlSegments[1]).then(
        manifest => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.write(JSON.stringify(manifest));
          res.end();
        },
        e => {
          res.statusCode = 500;
          res.write(e.message);
          res.end;
        }
      );
    } else if (
      req.method == "GET" &&
      urlSegments.length == 4 &&
      packageMap[urlSegments[1]] &&
      urlSegments[3].endsWith(".tgz")
    ) {
      //console.log("Get tarball for " + urlSegments[3]);
      getTarball(urlSegments[3]).then(tarball => {
        res.statusCode = 200;
        res.write(tarball);
        res.end();
      });
    } else {
      forward(req, res);
    }
  } catch (e) {
    console.error("PROXY SERVER ERROR : ", e);
  }
});

createPackages().then(
  () => {
    server.listen(PORT);
  },
  e => {
    console.error(e);
    process.exitCode = 1;
  }
);
