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

> Make sure that the build step is run before running the publish. If not done, the shipped tar file contains no build.

## Example

The `example user management` module that we created in [Develop](/getting-started/develop) guide is shipped to NPM Public Registry at https://www.npmjs.com/package/somod-example-user-management

> ## NPM Registries
>
> An NPM Registry is web-based storage of artifacts whose APIs are compatible with the NPM CLI.
>
> https://npmjs.com is a public registry holding all public packages.
> SOMOD recommends only the public SOMOD modules be pushed to this registry. Any other modules, private, > getting-started, or examples to be pushed to private NPM registries
>
> [GitHub](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) > and [GitLab](https://docs.gitlab.com/ee/user/packages/npm_registry/) provide a way to have your own private NPM > registry.

In the [Next](/getting-started/reuse) chapter, let us understand how to reuse a shipped SOMOD module.
