import { isFunction, isString, isSymbol } from './is.js';
import { get } from './object.js';

export function orderBy<T>(
	array: Array<T>,
	fields: (string | ((item: T) => any))[],
	orders: ('asc' | 'desc')[],
): Array<T> {
	return array.sort((a, b) => {
		let index = -1,
			// eslint-disable-next-line prefer-const
			length = fields.length,
			// eslint-disable-next-line prefer-const
			ordersLength = orders.length;

		while (++index < length) {
			const field = fields[index];
			const filedFn = isFunction(field);

			const objCriteria = filedFn ? field(a) : (a as any)?.[field];
			const othCriteria = filedFn ? field(b) : (b as any)?.[field];

			const result = compareAscending(objCriteria, othCriteria);

			if (result) {
				if (index >= ordersLength) {
					return result;
				}
				return result * (orders[index] === 'desc' ? -1 : 1);
			}
		}

		return 0;
	});
}

export function keyBy<T, K extends MaybePropertyKey<T>>(
	array: T[],
	keyBy: K,
): Map<IsPropertyKey<T, K, K>, T> {
	const result = new Map();

	for (const item of array) {
		result.set((item as any)?.[keyBy], item);
	}

	return result;
}

export function uniq<T extends any[]>(value: T): T {
	if (!Array.isArray(value)) {
		return [] as any;
	}

	return [...new Set(value)] as T;
}

/**
 * Creates an array of unique values from all given arrays.
 *
 * This function takes two arrays, merges them into a single array, and returns a new array
 * containing only the unique values from the merged array.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} arr1 - The first array to merge and filter for unique values.
 * @param {T[]} arr2 - The second array to merge and filter for unique values.
 * @returns {T[]} A new array of unique values.
 *
 * @example
 * const array1 = [1, 2, 3];
 * const array2 = [3, 4, 5];
 * const result = union(array1, array2);
 * // result will be [1, 2, 3, 4, 5]
 */
export function union<T>(arr1: readonly T[], arr2: readonly T[]): T[] {
	return uniq(arr1.concat(arr2));
}

/**
 * Extract the elements from an array that are unique according to a comparator function
 */
export function uniqueBy<T>(array: T[], comparator: ((value: T) => any) | PropertyKey): T[] {
	const seen = new Set();

	if (!isFunction(comparator)) {
		const key = comparator;
		comparator = (value) => get(value, key);
	}

	return array.filter((value) => {
		const computed = (comparator as any)(value);
		const hasSeen = seen.has(computed);
		if (!hasSeen) {
			seen.add(computed);
		}
		return !hasSeen;
	});
}

type MaybePropertyKey<T> = T extends object ? keyof T | PropertyKey : PropertyKey;

type PropertyKeyLiteralToType<T> = T extends string
	? string
	: T extends number
		? number
		: T extends symbol
			? symbol
			: T;

type IsPropertyKey<T, V, L> = T extends object
	? V extends keyof T
		? T[V]
		: L
	: PropertyKeyLiteralToType<L>;

export function groupBy<T, K extends MaybePropertyKey<T>>(
	array: T[],
	keyBy: K,
): Map<IsPropertyKey<T, K, K>, T[]> {
	const result = new Map();

	array.forEach((item) => {
		const list = result.get((item as any)[keyBy]) || [];

		list.push(item);

		result.set((item as any)[keyBy], list);
	});

	return result;
}

function compareAscending(value: any, other: any) {
	if (value !== other) {
		const valIsDefined = value !== undefined,
			valIsNull = value === null,
			valIsReflexive = value === value,
			valIsSymbol = isSymbol(value);

		const othIsDefined = other !== undefined,
			othIsNull = other === null,
			othIsReflexive = other === other,
			othIsSymbol = isSymbol(other);

		if (
			(!othIsNull && !othIsSymbol && !valIsSymbol && value > other) ||
			(valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol) ||
			(valIsNull && othIsDefined && othIsReflexive) ||
			(!valIsDefined && othIsReflexive) ||
			!valIsReflexive
		) {
			return 1;
		}
		if (
			(!valIsNull && !valIsSymbol && !othIsSymbol && value < other) ||
			(othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol) ||
			(othIsNull && valIsDefined && valIsReflexive) ||
			(!othIsDefined && valIsReflexive) ||
			!othIsReflexive
		) {
			return -1;
		}
	}
	return 0;
}

/**
 * Divide an array into sub-arrays of a fixed chunk size
 */
export function chunk<T>(list: T[], size: number = 1): T[][] {
	return list.reduce((res, item, index) => {
		if (index % size === 0) {
			// @ts-ignore
			res.push([]);
		}
		// @ts-ignore
		res[res.length - 1].push(item);
		return res;
	}, []);
}

export function arrayable<T>(value: T): Exclude<T extends Array<infer X> ? X : T, undefined>[] {
	const result: any = Array.isArray(value)
		? value
		: value === null
			? []
			: value === undefined
				? []
				: isString(value)
					? value
							.split(',')
							.map((v) => v.trim())
							.filter(Boolean)
					: [value];

	return result;
}
