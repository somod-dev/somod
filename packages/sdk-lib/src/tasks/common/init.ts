import { logWarning } from "@solib/cli-base";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { get } from "https";
import { dirname, join } from "path";

const download = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const req = get(url, res => {
      if (res.statusCode == 200) {
        const chunks: string[] = [];
        res.on("data", chunk => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve(chunks.join(""));
        });
        res.on("error", e => {
          reject(e);
        });
      } else {
        reject(`Invalid Response ${res.statusCode}: ${res.statusMessage}`);
      }
    });
    req.on("error", e => reject(e));
  });
};

export const init = async (dir: string, force = false) => {
  const baseUrl =
    "https://raw.githubusercontent.com/sodaru/somod-init-template/v1/";
  const filesListStr = await download(baseUrl + "files");
  const filesList = filesListStr.split("\n").filter(file => !!file);

  await Promise.all(
    filesList.map(async file => {
      const content = await download(baseUrl + file);
      const fileSavePath = join(dir, file);

      const saveFile = async () => {
        await mkdir(dirname(fileSavePath), { recursive: true });
        await writeFile(fileSavePath, content);
      };

      if (existsSync(fileSavePath)) {
        logWarning(`${file} exists : ${force ? "REPLACED" : "SKIPPED"}`);
        if (force) {
          await saveFile();
        }
      } else {
        await saveFile();
      }
    })
  );
};
