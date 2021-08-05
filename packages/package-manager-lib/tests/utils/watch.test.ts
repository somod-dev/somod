import { sync as rimrafSync } from "rimraf";
import { createFiles, createTempDir, deleteDir } from "../utils";
import watch from "../../src/utils/watch";
import { join, dirname } from "path";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from "fs";

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
};

const helper = {
  createDir: async dir => {
    mkdirSync(dir);
    await sleep(100);
  },

  createFile: async (path, data) => {
    writeFileSync(path, data);
    await sleep(100);
  },

  deleteDir: async dir => {
    rimrafSync(dir);
    await sleep(100);
  },

  deleteFile: async path => {
    rimrafSync(path);
    await sleep(100);
  }
};

describe("Test watch", () => {
  let dir: string = null;
  let closeHandle: () => void = null;

  beforeEach(() => {
    dir = createTempDir();
  });

  afterEach(() => {
    deleteDir(dir);
    closeHandle();
  });

  test("start with empty dir", async () => {
    const watchDir = join(dir, "watch");
    const destDir = join(dir, "dest");
    const backupDir = join(dir, "backup");

    closeHandle = watch(
      watchDir,
      destDir,
      file => {
        const destination = join(destDir, file);
        const destinationDir = dirname(destination);
        mkdirSync(destinationDir, { recursive: true });
        copyFileSync(join(watchDir, file), destination);
      },
      backupDir
    );

    expect(existsSync(destDir)).toBeFalsy();

    await sleep(100);

    await helper.createDir(watchDir);

    await helper.createFile(join(watchDir, "f1"), "f1content");

    expect(existsSync(destDir)).toBeTruthy();
    expect(readFileSync(join(destDir, "f1"), { encoding: "utf8" })).toEqual(
      "f1content"
    );
  });

  test("start with existing dir", async () => {
    const watchDir = join(dir, "watch");
    const destDir = join(dir, "dest");
    const backupDir = join(dir, "backup");

    createFiles(watchDir, { f1: "f1content", "d1/f1": "d1f1content" });

    await sleep(100);

    closeHandle = watch(
      watchDir,
      destDir,
      file => {
        const destination = join(destDir, file);
        const destinationDir = dirname(destination);
        mkdirSync(destinationDir, { recursive: true });
        copyFileSync(join(watchDir, file), destination);
      },
      backupDir
    );

    expect(existsSync(destDir)).toBeFalsy();

    await helper.createFile(join(watchDir, "f2"), "f2content");

    expect(readFileSync(join(destDir, "f2"), { encoding: "utf8" })).toEqual(
      "f2content"
    );
  });

  test("deep change", async () => {
    const watchDir = join(dir, "watch");
    const destDir = join(dir, "dest");
    const backupDir = join(dir, "backup");

    createFiles(watchDir, { f1: "f1content", "d1/f1": "d1f1content" });

    await sleep(100);

    closeHandle = watch(
      watchDir,
      destDir,
      file => {
        const destination = join(destDir, file);
        const destinationDir = dirname(destination);
        mkdirSync(destinationDir, { recursive: true });
        copyFileSync(join(watchDir, file), destination);
      },
      backupDir
    );

    expect(existsSync(destDir)).toBeFalsy();

    await helper.createDir(join(watchDir, "d2"));

    await helper.createFile(join(watchDir, "d2", "f2"), "d2f2content");

    expect(
      readFileSync(join(destDir, "d2", "f2"), { encoding: "utf8" })
    ).toEqual("d2f2content");
  });

  test("delete without backup", async () => {
    const watchDir = join(dir, "watch");
    const destDir = join(dir, "dest");
    const backupDir = join(dir, "backup");

    createFiles(watchDir, { f1: "f1content", "d1/f1": "d1f1content" });

    await sleep(100);

    closeHandle = watch(
      watchDir,
      destDir,
      file => {
        const destination = join(destDir, file);
        const destinationDir = dirname(destination);
        mkdirSync(destinationDir, { recursive: true });
        copyFileSync(join(watchDir, file), destination);
      },
      backupDir
    );

    expect(existsSync(destDir)).toBeFalsy();

    const f1 = join(watchDir, "f1");

    expect(existsSync(f1)).toBeTruthy();

    await helper.deleteFile(f1);

    expect(existsSync(destDir)).toBeFalsy();

    const d2 = join(watchDir, "d2");

    await helper.createDir(d2);

    const d2f2 = join(watchDir, "d2", "f2");

    await helper.createFile(d2f2, "d2f2content");

    expect(
      readFileSync(join(destDir, "d2", "f2"), { encoding: "utf8" })
    ).toEqual("d2f2content");

    await helper.deleteFile(d2f2);

    expect(existsSync(join(destDir, "d2", "f2"))).toBeFalsy();
  });

  test("delete with backup", async () => {
    const watchDir = join(dir, "watch");
    const destDir = join(dir, "dest");
    const backupDir = join(dir, "backup");

    createFiles(watchDir, { f1: "f1content", "d1/f1": "d1f1content" });
    createFiles(backupDir, { "d2/f2": "d2f2contentInbackup" });

    await sleep(100);

    closeHandle = watch(
      watchDir,
      destDir,
      file => {
        const destination = join(destDir, file);
        const destinationDir = dirname(destination);
        mkdirSync(destinationDir, { recursive: true });
        copyFileSync(join(watchDir, file), destination);
      },
      backupDir
    );

    expect(existsSync(destDir)).toBeFalsy();

    const d2 = join(watchDir, "d2");

    await helper.createDir(d2);

    const d2f2 = join(watchDir, "d2", "f2");

    await helper.createFile(d2f2, "d2f2content");

    expect(
      readFileSync(join(destDir, "d2", "f2"), { encoding: "utf8" })
    ).toEqual("d2f2content");

    await helper.deleteFile(d2f2);

    expect(
      readFileSync(join(destDir, "d2", "f2"), { encoding: "utf8" })
    ).toEqual("d2f2contentInbackup");
  });
});
