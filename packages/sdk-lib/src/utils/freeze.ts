import { isArray, isPlainObject } from "lodash";

export const freeze = <T = unknown>(obj: T, deep = false): T => {
  if (!deep) {
    return Object.freeze(obj);
  } else {
    const visited: unknown[] = [];
    const queue: unknown[] = [obj];

    while (queue.length > 0) {
      const item = queue.shift();
      if (!visited.includes(item)) {
        visited.push(Object.freeze(item));
        if (isPlainObject(item)) {
          queue.push(...Object.values(item));
        } else if (isArray(item)) {
          queue.push(...item);
        }
      }
    }
    return visited[0] as T;
  }
};
