const unixStylePath = (path: string): string => {
  return path.split("\\").join("/");
};

export default unixStylePath;
