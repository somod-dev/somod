/* eslint-disable */
const { readFile } = require("fs/promises");
const { createServer, IncomingMessage, ServerResponse } = require("http");
const { request } = require("https");
const { join } = require("path");

const PORT = process.env.PORT || 8000;

const packageMap = {
  "create-somod": "create",
  somod: "somod",
  "somod-middleware": "middleware",
  "somod-schema": "schema",
  "somod-types": "types"
};

const getManifest = async packageName => {
  const packageJsonPath = join(
    __dirname,
    "../..",
    packageMap[packageName],
    "package.json"
  );

  const packageJsonContent = await readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonContent);

  const result = {
    _id: packageName,
    _rev: "1-a89780bcd",
    "dist-tags": { latest: packageJson.version },
    versions: {
      [packageJson.version]: {
        _id: packageJson.name + "@" + packageJson.version,
        _nodeVersion: "16.17.1",
        _npmVersion: "8.15.0",
        dist: {
          tarball: `http://localhost:${PORT}/${packageName}/-/${packageName}-${packageJson.version}.tgz`
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
  req.pipe(forwardReq);
};

const server = createServer((req, res) => {
  //console.log(req.method, req.url);

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
});

server.listen(PORT);
