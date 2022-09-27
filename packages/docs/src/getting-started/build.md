```YAML
title: Build SOMOD Module
meta:
  description:
    Build the SOMOD Module to make it ready for sharing.
```

# Build SOMOD Module

---

After creating the SOMOD module, the module has to be built. The build step validates and creates files ready for sharing inside the `build` directory.

Use the following command to build the SOMOD module.

```
npx somod build -v
```

The [SOMOD CLI](/reference/cli) guide contains the complete details of this command.

After the build, The SOMOD module is shipped to the NPM Registry for distribution. In the [Next Chapter](/getting-started/ship), let us understand how to ship the module to npm registries.
