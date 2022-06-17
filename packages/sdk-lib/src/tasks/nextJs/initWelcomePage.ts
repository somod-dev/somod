import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { path_pages, path_ui } from "../../utils/constants";

export const initWelcomePage = async (dir: string): Promise<void> => {
  const pageName = "index.tsx";
  const pagePath = join(dir, path_ui, path_pages, pageName);

  const pageContent = `import * as React from "react";

const Index: React.FunctionComponent = () => {
  return (
    <div>
      <h1>Welcome to Next Js Package</h1>
      <h2>This is a sample page</h2>
      <p>
        <a
          href="https://sodaru.com/platform"
          target="_blank"
        >
          Click Me
        </a>
        to learn more
      </p>
    </div>
  );
};

export default Index;`;

  if (!existsSync(pagePath)) {
    const pageDir = dirname(pagePath);
    await mkdir(pageDir, { recursive: true });
    await writeFile(pagePath, pageContent);
  }
};
