```YAML
title: Structure of package.json in SOMOD Module | SOMOD
meta:
  description:
    SOMOD defines the structure of package.json to facilitate the integration and working of the SOMOD module.
```

# SOMOD package.json

---

SOMOD makes some changes to the original specification of package.json.

The `package.json` is validated before every build of the SOMOD module to ensure its correctness.

The following properties in the package.json object have a particular purpose in the SOMOD module.

- `name`  
  The name of the npm package is the name of the SOMOD module.
- `version`  
  SOMOD suggests having semantic versioning. Read more on semantic versioning [here](https://semver.org/).
- `description`  
  Describe the SOMOD module in this property. The SOMOD module must contain a description.
- `module`  
  The build step in SOMOD creates javascript in ES6 module format at `build` directory. Webpack and other bundlers use module to resolve the entry point for an ES6 module. SOMOD always generates the entry point at `build/lib/index.js`, hence this property must have a hardcoded value of `build/lib/index.js`
- `sideEffects`  
  The sideEffects property is an instruction to the bundler that it can prune all of the code from this package. The SOMOD module must have this property set to `false`.
- `main`, `jsnext:main`, `type`  
  These properties make the bundlers fail when resolving the ES6 modules. Hence the use of these properties is not allowed in the SOMOD module.
- `typings`  
  The typings property points to the entry point of the type declaration file. More on type declarations is [here](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html).
- `files`  
  The files property is an array of file patterns that describes the entries to be included in the package.
  SOMOD builds source code into the `build` directory. So files property must include the `"build"` in the array.
- `somod`  
  The somod property differentiates other npm packages from SOMOD modules. NPM packages containing `somod` property in `package.json` are considered SOMOD modules. The `somod build` command sets this to the version of somod CLI used during the build.

> Otherwise documented, all other properties in package.json behave as defined in the [original specification](https://docs.npmjs.com/cli/v8/configuring-npm/package-json).

## Sample `package.json`

```json
{
  "name": "my-module",
  "version": "1.0.0",
  "module": "build/lib/index.js",
  "typings": "build/lib/index.d.ts",
  "files": ["build"],
  "sideEffects": false,
  "somod": "1.13.3",
  "devDependencies": {
    "somod": "^1.13.3"
  }
}
```

In our [next section](/reference/main-concepts/directory-structure), we will explore the directory structure of a SOMOD module.
