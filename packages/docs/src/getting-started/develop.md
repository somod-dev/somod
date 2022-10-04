```YAML
title: Develop SOMOD Module
meta:
  description:
    Create Infrastructure, FrontEnd and BackEnd code in SOMOD Module

```

# Develop SOMOD Module

---

Developing a SOMOD module involves 3 steps.

1. Add required modules as dependencies

   The fundamental feature of SOMOD is Reusability. By adding the readily available modules as dependencies we can get the complete functionality of the dependency modules in our current module.

2. Create Infrastructure and BackEnd Code in a serverless framework

   The serverless infrastructure and the backend code are created in the `serverless` directory

3. Create the User Interface

   Create the NextJs Pages which are part of this module under the `ui/pages` directory

Let us start by adding the dependency in the [next chapter](getting-started/develop/add-dependencies)
