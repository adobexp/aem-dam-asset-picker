export const removePrefix = (path: string, prefix: string) => {
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length);
  }
  return path;
};
