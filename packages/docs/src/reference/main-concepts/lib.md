```YAML
title: lib directory in SOMOD Module | SOMOD
meta:
  description:
    The <strong>lib</strong> directory contains pure javascript code exported from a SOMOD module.
```

# SOMOD's `lib` Directory

---

Among all directories in SOMOD, lib is the simplest one. The Developer can write the reusable code in the lib directory. The build command compiles typescript in the lib directory into build/lib, generating javascript and type definitions.

As discussed in the [package.json](/reference/main-concepts/package.json) structure, the module property has a "build/lib/index.js" value. So the code exported from "lib/index.ts" is available for other modules to import.

```bash

project-root
    |
    +-- build/
    |     +-- lib/
    |           +-- other.js
    |           +-- index.js  <-------+
    |                     ^           |
    |                     |           |
    |                  'BUILD'     'module in package.json refers to this'
    +-- lib/              |           |
    |    +-- other.ts     |           |
    |    +-- index.ts  ---+           |
    |                                 |
    +-- package.json -----------------+

```

In the [next section](/reference/main-concepts/serverless), let's explore what our `serverless` directory contains.
