import {
  copyFileSync,
  existsSync,
  readdirSync,
  rmdirSync,
  statSync,
  unlinkSync
} from "fs";
import { relative, join, normalize } from "path";
import Watchpack from "watchpack";

type OnFileChange = (file: string) => void;

type WatchCloseHandler = () => void;

const watch = (
  watchDir: string,
  destinationDir: string,
  onFileChange: OnFileChange,
  backupDir: string
): WatchCloseHandler => {
  const wp = new Watchpack({});
  const normalizedWatchDir = normalize(watchDir);
  let watchingParent = false;
  let dirWatch = normalizedWatchDir;
  while (!existsSync(dirWatch) && dirWatch.length > 0) {
    dirWatch = join(dirWatch, "..");
  }
  watchingParent = dirWatch != normalizedWatchDir;
  wp.watch([], [dirWatch]);

  wp.on("change", (filePath: string, mtime: number) => {
    if (watchingParent) {
      if (filePath == normalizedWatchDir) {
        watchingParent = false;
        wp.watch([], [normalizedWatchDir]);
      }
      return;
    }

    const relativeFilepath = relative(watchDir, filePath);
    if (mtime) {
      const stats = statSync(filePath);
      // change or creation
      if (stats.isFile()) {
        // apply only file changes
        onFileChange(relativeFilepath);
      }
    } else {
      // deletion
      const destinationPath = join(destinationDir, relativeFilepath);
      if (existsSync(destinationPath)) {
        const stats = statSync(destinationPath);
        if (stats.isFile()) {
          const backupPath = join(backupDir, relativeFilepath);
          if (existsSync(backupPath)) {
            copyFileSync(backupPath, destinationPath);
          } else {
            unlinkSync(destinationPath);
          }
        } else if (stats.isDirectory()) {
          const dirFiles = readdirSync(destinationPath);
          if (dirFiles.length == 0) {
            rmdirSync(destinationPath);
          }
        }
      }
    }
  });

  return () => {
    wp.close();
  };
};

export default watch;
