```YAML
title: Ship SOMOD Module
meta:
  description:
    Ship the SOMOD module so that other modules can reuse it.
```

# Ship SOMOD Module

---

Because every SOMOD module is an NPM Package in itself, shipping the SOMOD module is the same as any other NPM Package.

Run this command to publish to the NPM registry

```
npm publish
```

> Only the files and directories mentioned in `files` property of the `package.json` are included in the shipment.  
> In SOMOD module, `build` directory is added in the `files` property and also ignored from git.
>
> So it is important to run build step before creating the pack for publishing.  
> Configuring below scripts in `package.json` will help to do so.
>
> ```json
> {
>   "scripts": {
>     "prepack": "npx somod build"
>   }
> }
> ```

## NPM Registries

An NPM Registry is web-based storage of artifacts whose APIs are compatible with the NPM CLI.

https://npmjs.com is a public registry holding all public packages.
SOMOD recommends only the public SOMOD modules be pushed to this registry. Any other modules, private, getting-started, or examples to be pushed to private NPM registries

[GitHub](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) and [GitLab](https://docs.gitlab.com/ee/user/packages/npm_registry/) provide a way to have your own private NPM registry.
