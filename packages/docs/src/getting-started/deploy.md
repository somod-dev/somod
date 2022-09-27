```YAML
title: Deploy SOMOD Module
meta:
  description:
    Deploy AWS SAM and NextJs Project prepared by SOMOD.
```

# Deploy SOMOD Module

---

SOMOD prepare command creates deployable AWS SAM Project and NextJs Project.

```
npx somod prepare
```

- AWS SAM Project

  For the SAM Project, SOMOD creates the `template.yaml` file and the `.somod/` directory at the root of the module.

  The [AWS SAM Deployment](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html) guide explains the steps for AWS SAM Project deployment.

- NextJs Project

  For the NextJs Project, SOMOD creates the `pages/`, `public/` directories, `.env`, and `next.config.js` files at the root of the module.

  The [NextJs Deployment](https://nextjs.org/docs/deployment) guide explains the different options for deploying the NextJs project.

## What Next?

Browse our [module catalog](/catalog) to find out readily available modules.

Create new modules for your business use cases, and add the common modules as dependencies.

You can also submit your modules to the catalog. Read more about contributing to the module catalog [here](/catalog/contribute).
