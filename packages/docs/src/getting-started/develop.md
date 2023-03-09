```YAML
title: Develop SOMOD Module
meta:
  description:
    Create Infrastructure, BackEnd, and FrontEnd code in SOMOD Module

```

# Develop SOMOD Module

---

> ### Prerequisits
>
> Before continuing this guild, create a new NPM package and set it up for somod module. Refer the [Setup](/getting-started/setup) guide on how to setup a SOMOD module.

Developing a SOMOD module involves 3 steps.

1. Add required modules as dependencies

   The fundamental features of SOMOD are Reusability & Extendability. By adding the readily available modules as dependencies we can get the complete functionality of the dependency modules in our current module.

2. Create Infrastructure and BackEnd Code in a serverless framework

   The serverless infrastructure and the backend code are created in the `serverless` directory

3. Create the User Interface

   Create the NextJs Pages which are part of this module under the `ui/pages` directory

Let us start by adding the dependency in the [next chapter](/getting-started/develop/add-dependencies)
