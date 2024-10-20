import _cloneDeep from 'lodash/cloneDeep.js';
import _cloneDeepWith from 'lodash/cloneDeepWith.js';
import _defaultsDeep from 'lodash/defaultsDeep.js';
import _get from 'lodash/get.js';
import _set from 'lodash/set.js';
import _unset from 'lodash/unset.js';

import { isObject } from './is.js';

export const get = _get;

export const set = _set;

export const unset = _unset;

export const cloneDeepWith = _cloneDeepWith;

export function flatten(obj: Record<string, any>, prefix = '') {
	const result = {};

	for (const [key, value] of Object.entries(obj)) {
		if (isObject(value)) {
			const nextLevel = flatten(value, `${prefix}${key}.`);
			Object.assign(result, nextLevel);
		} else {
			// @ts-ignore
			result[`${prefix}${key}`] = value;
		}
	}

	return result;
}

export function unflatten(obj: object) {
	const result = {};

	Object.keys(obj).forEach((path) => {
		// @ts-ignore
		_set(result, path, obj[path]);
	});

	return result;
}

interface PrefixedValuesOptions {
	prefix?: string;
	prefixTrim: boolean;
}

export function prefixedValues(obj: object, options: PrefixedValuesOptions | string) {
	let prefix;
	let prefixTrim = true;

	if (typeof options === 'string') {
		prefix = options;
	} else {
		prefix = options.prefix;
		prefixTrim = options.prefixTrim !== false;
	}

	const result = {};

	// eslint-disable-next-line prefer-const
	for (let [key, value] of Object.entries(obj)) {
		if (!key.startsWith(prefix!)) continue;
		if (prefixTrim) key = key.substring(prefix!.length);

		// @ts-ignore
		result[key] = value;
	}

	return result;
}

export const cleanObject = (input: Record<string, any>) => {
	Object.keys(input).forEach((key: string) => {
		delete input[key];
	});
};

/**
 * This method is like _.clone except that it recursively clones value.
 *
 * @param value The value to recursively clone.
 * @return Returns the deep cloned value.
 */
export const deepClone = <T>(value: T): T => {
	return _cloneDeep(value);
};

/**
 * This method is like _.defaults except that it recursively assigns default properties.
 * @param object The destination object.
 * @param sources The source objects.
 * @return Returns object.
 */
export const deepDefaults = _defaultsDeep;

export const deepAssign = (dest: object, source: object): void => {
	for (const key of Object.keys(source)) {
		const destValue = (dest as any)[key];
		const sourceValue = (source as any)[key];

		if (isObject(destValue) && isObject(sourceValue)) {
			deepAssign(destValue as any, sourceValue as any);
		} else {
			(dest as any)[key] = sourceValue;
		}
	}
};

export const hasOwn = <T extends object, K extends keyof T>(val: T, key: K): key is K =>
	Object.prototype.hasOwnProperty.call(val, key);

export const toMap = <KValue = string, TValue = unknown>(
	arr: Readonly<any[]>,
	keyBy: string,
): Map<KValue, TValue> => {
	const map = new Map<KValue, TValue>();

	for (const item of arr) {
		const key = item[keyBy];
		map.set(key as KValue, item);
	}

	return map;
};

export function flagsToMap(
	value: number | bigint,
	map: Record<string, number | bigint>,
): Record<string, boolean> {
	const result: Record<string, boolean> = {};

	const compare = typeof value === 'bigint' ? 0n : 0;

	for (const [key, mask] of Object.entries(map)) {
		result[key] = ((value as number) & (mask as number)) !== compare;
	}

	return result;
}

/**
 * Creates a new object composed of the picked object properties.
 *
 * This function takes an object and an array of keys, and returns a new object that
 * includes only the properties corresponding to the specified keys.
 *
 * @template T - The type of object.
 * @template K - The type of keys in object.
 * @param {T} obj - The object to pick keys from.
 * @param {K[]} keys - An array of keys to be picked from the object.
 * @returns {Pick<T, K>} A new object with the specified keys picked.
 *
 * @example
 * const obj = { a: 1, b: 2, c: 3 };
 * const result = pick(obj, ['a', 'c']);
 * // result will be { a: 1, c: 3 }
 */
export function pick<T extends Record<string, any>, U extends keyof T>(
	obj: T | null | undefined,
	keys: Readonly<Array<U> | Set<U> | Array<string> | Set<string>>,
): Pick<T, U> {
	const keysSet = Array.isArray(keys) ? new Set(keys) : keys instanceof Set ? keys : undefined;

	const result: any = {};

	if (!keysSet || !isObject(obj)) {
		return result;
	}

	for (const key of keysSet.values()) {
		if (Object.hasOwn(obj, key)) {
			result[key] = (obj as any)[key];
		}
	}

	return result;
}

/**
 * Creates a new object with specified keys omitted.
 *
 * This function takes an object and an array of keys, and returns a new object that
 * excludes the properties corresponding to the specified keys.
 *
 * @template T - The type of object.
 * @template K - The type of keys in object.
 * @param {T} obj - The object to omit keys from.
 * @param {K[]} keys - An array of keys to be omitted from the object.
 * @returns {Omit<T, K>} A new object with the specified keys omitted.
 *
 * @example
 * const obj = { a: 1, b: 2, c: 3 };
 * const result = omit(obj, ['b', 'c']);
 * // result will be { a: 1 }
 */
export function omit<T extends Record<string, any>, U extends keyof T>(
	obj: T,
	excludes: Readonly<Array<U> | Set<U> | Array<string> | Set<string>>,
): Omit<T, U> {
	const excludesSet = Array.isArray(excludes)
		? new Set(excludes)
		: excludes instanceof Set
			? excludes
			: undefined;

	if (!excludesSet) {
		return obj;
	}

	const result: any = {};

	if (!isObject(obj)) {
		return result;
	}

	for (const [key, value] of Object.entries(obj)) {
		if (excludesSet.has(key)) continue;

		result[key] = value;
	}

	return result;
}

export function has<T extends PropertyKey>(value: any, keys: T[]): value is { [K in T]: any } {
	if (!isObject(value)) return false;

	for (let idx = 0; idx < keys.length; idx++) {
		const element = keys[idx];

		if (!(element in value)) return false;
	}

	return true;
}

export const def = (obj: object, key: string | symbol, value: any, writable = false) => {
	Object.defineProperty(obj, key, {
		configurable: true,
		enumerable: false,
		writable,
		value,
	});
};
