export function parseBool(value: string): boolean {
  if (!value) return false;
  return value.toLowerCase() === 'true';
}

/**
 * @summary flatten a nested array of objects into a single 1D array.
 * @param {Array<any>} arr
 * @return {*}  {Array<any>}
 */
export function flatMap(arr: Array<any>): Array<any> {
  return arr.reduce((acc, item) => {
    if (Array.isArray(item)) {
      // If the item is an array, recursively flatten it
      return acc.concat(flatMap(item));
    } else {
      // Otherwise, just add the item to the accumulator
      return acc.concat(item);
    }
  }, []);
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function isTruthy(value) {
  return !!value;
}

export function convertBoolToString(bool: boolean): string {
  return bool ? 'True' : 'False';
}

export function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Reflect.ownKeys(object);

  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = object[name];

    if (
      (value && typeof value === 'object') ||
      (typeof value === 'function' && !Object.isFrozen(value))
    ) {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}
