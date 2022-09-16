```YAML
title: SOMOD Module | SOMOD
meta:
  description:
    Modules are the building blocks of SOMOD architecture. SOMOD combines Infrastructure, Backend, and Frontend code in a single reusable package called <strong>Module<strong>
```

# Module

---

SOMOD combines Infrastructure, Backend, and Frontend code in a single reusable package called **Module**. Modules are packaged, distributed, and reused using NPM.

Start by creating a simple module, then add it as an npm dependency in another module, and so on. SOMOD integrates all dependency modules to create AWS SAM Project and NextJs Project.

> - You can deploy the **AWS SAM** Project using SAM CLI. To know more about AWS SAM, visit their documentation [here](https://aws.amazon.com/serverless/sam/).
> - **NextJs** is an all-in-one framework to develop awesome UI using React. You can deploy NextJs projects to Managed Server on Vercel. NextJs [documents](https://nextjs.org/) other ways of deploying too.

## Strcuture of a Module

To facilitate the integration and working of the Module, SOMOD defines the **directory structure** of the SOMOD project.

Initialize the SOMOD project by simply running

```bash
npx create-somod
```

> NPM zips all or selected files and directories of the project into a `tar.gz` file for distribution. NPM mandates and defines the content structure of `package.json`, the rest of the content is the developer's choice. Along with the content of package.json, SOMOD defines the directory structure of whole project.

Let's understand the structure of `package.json` in the [next section](/reference/main-concepts/package.json).
