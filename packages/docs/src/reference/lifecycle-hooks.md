```YAML
title: SOMOD LifeCycle Hooks Reference | SOMOD
meta:
  description:
    Extend SOMOD CLI using life-cycle hooks
```

# SOMOD LifeCycle Hooks

---

SOMOD LifeCycle Hooks provides a way to extend the functionality of SOMOD.

## Develop Hooks

Create the `lifeCycle.ts` file at the root of the module to provide the hooks.

> SOMOD build command bundles `lifeCycle.ts` into `build/lifeCycle.js` file.

Following named exports are allowed from within the `lifeCycle.ts` file

- `namespaceLoader`  
  Additional namespace loader. this is a callback function that returns the namespaces for the given module.
  Refer to [Namespaces](/reference/main-concepts/namespaces) for more details on namespaces.

- `keywords`  
  Additional keyword definitions that are to be applied while parsing `serverless/template.yaml` and `ui/config.yaml`

- `prebuild`  
  A callback function is to be called before starting the `build` command.

- `build`  
  A callback function is to be called after starting the `build` command.

- `preprepare`  
  A callback function is to be called before starting the `prepare` command.

- `prepare`  
  A callback function is to be called after starting the `prepare` command.

All of the lifecycle hooks defined above are optional

> SOMOD invokes the lifecycle methods in the order of module dependency.  
> for **namespaceLoader**, **build** and **prepare**, the order is child to parent  
> for **prebuild** and **preprepare**, the order is parent to child.
