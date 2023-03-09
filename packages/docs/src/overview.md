```YAML
title: Overview | SOMOD - Serverless Optimized Modules
meta:
  description:
    Develop, Build, and Share your serverless applications with SOMOD. SOMOD provides a CLI toolset for modularizing the serverless code.
```

# SOMOD - **S**erverless **O**ptimized **Mod**ules

---

## Overview

Develop, Build, and Share your serverless applications with SOMOD.
SOMOD provides a CLI toolset for modularizing the code for serverless infrastructure. The SOMOD is an open-source CLI available as an [NPM package](https://www.npmjs.com/package/somod).

> ## Does serverless means no server at all? The answer is Yes and No.
>
> To run any web application, one needs a server comprised of a physical machine connected to the network and software services running in that machine to serve the incoming request. The cloud providers initially removed the overhead of maintaining the physical servers. But the maintenance and scaling of these virtual software servers is still an application owner's responsibility.
>
> In serverless, even the software servers are managed by cloud providers. The application owner develops the application and provides code to the serverless platform. The serverless platform takes care of the deployment and maintenance of the service.
>
> In summary, there is always a server at the back for all web applications. But maintenance of the server (both physical and software) is moved to cloud providers in the serverless architecture.

## How SOMOD helps Serverless Application Development?

SOMOD provides a CLI toolset to develop and test serverless applications in smaller modules and then deploy these smaller modules together to the serverless platform.

A typical serverless application consists of Infrastructure as a Code (IaaC) and the actual code that runs in the backend. SOMOD helps to develop both the actual and infrastructure code in modules. SOMOD modules also contain code for UI along with backend code. During deployment, SOMOD combines code from all modules and creates deployment packages for serverless backend and UI.

## Features of SOMOD

- Create sharable and reusable modules
- Easily extendable modules
- Sharable UI code along with serverless code.
- Serverless Optimized
- Compatible with any module developed using SOMOD
- Readily available modules from our library
- Easy learning curve.

## Are you new to SOMOD?

Check our [Getting Started](/getting-started) guide to start developing reusable Serverless Modules.

## If you are an experienced user of SOMOD?

Check the [Reference](/reference) for detailed usage of SOMOD.

## Want to contribute?

The [Contribution](https://github.com/somod-dev/somod/blob/main/CONTRIBUTING.md) guide on GitHub helps you make contributions to the SOMOD project.
