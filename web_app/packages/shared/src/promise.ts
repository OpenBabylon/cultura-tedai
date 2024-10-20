import { fastIdle } from './fastIdle.js';

export interface Defer<T = unknown> {
	promise: Promise<T>;
	resolve: (value: T) => void;
	reject: (value: any) => void;
}

export function defer<T>(): Defer<T> {
	let resolve: any;
	let reject: any;

	const promise = new Promise<T>((_resolve, _reject) => {
		resolve = _resolve;
		reject = _reject;
	});

	return {
		resolve: resolve,
		reject: reject,
		promise: promise,
	};
}

export function delay(amount: 'tick' | number = 'tick') {
	const d = defer<void>();

	if (amount === 'tick') {
		fastIdle(d.resolve);
	} else {
		setTimeout(d.resolve, amount);
	}

	return d.promise;
}

export function timeout<T = any>(
	ms: number,
	promiseOrCallback: Promise<T> | ((abortSignal: AbortSignal) => Promise<T>),
	timeoutError?: any,
): Promise<T> {
	const abortController = new AbortController();

	let taskResult: any;

	if (typeof promiseOrCallback === 'function') {
		taskResult = promiseOrCallback(abortController.signal);
	} else if (isPromise(promiseOrCallback)) {
		taskResult = promiseOrCallback;
	}

	if (!isPromise(taskResult)) {
		return taskResult;
	}

	let timer: any;

	return Promise.race([
		taskResult,
		new Promise((resolve, reject) => {
			timer = setTimeout(() => {
				abortController.abort();
				reject(timeoutError || new Error('Timeout'));
			}, ms);
		}),
	]).finally(() => {
		timer && clearTimeout(timer);
		timer = undefined;
	}) as Promise<T>;
}

export function nextTickIteration(
	amount: number,
	delay: number | 'tick' = 'tick',
): () => Promise<void> {
	let counter = 0;

	return () => {
		counter++;

		if (counter >= amount) {
			counter = 0;
			return new Promise((resolve) => {
				if (delay === 'tick') {
					fastIdle(resolve);
				} else {
					setTimeout(resolve, delay);
				}
			});
		}

		return Promise.resolve();
	};
}

export async function asyncFilter<T>(
	array: T[],
	predicate: (value: T, index: number, array: Array<T>) => Promise<boolean> | boolean,
): Promise<T[]> {
	const result: T[] = [];

	const cooldown = nextTickIteration(10);

	for (let idx = 0; idx < array.length; idx++) {
		await cooldown();

		const value = array[idx];
		const valid = await predicate(value, idx, array);

		if (valid) {
			result.push(value);
		}
	}

	return result;
}

export async function asyncMap<T, U>(
	array: T[],
	callbackfn: (value: T, index: number, array: Array<T>) => Promise<U> | U,
	{ concurrency = 1 } = {},
): Promise<Array<U>> {
	let result: U[] = [];

	concurrency = Math.max(concurrency, 1);

	const cooldown = nextTickIteration(10);

	let i = 0;

	const handle = (value: T, index: number) => {
		return callbackfn(value, i + index, array);
	};

	while (i < array.length) {
		await cooldown();

		const batch = await Promise.all(array.slice(i, i + concurrency).map(handle));

		result = result.concat(batch);
		i += batch.length;
	}

	return result;
}

export async function asyncForEach<T>(
	array: T[],
	callbackfn: (value: T, index: number, array: Array<T>) => Promise<void> | void,
	{ concurrency = 1 } = {},
): Promise<void> {
	const cooldown = nextTickIteration(10);

	let i = 0;

	const handle = (value: T, index: number) => {
		return callbackfn(value, i + index, array);
	};

	while (i < array.length) {
		await cooldown();

		const batch = await Promise.all(array.slice(i, i + concurrency).map(handle));

		i += batch.length;
	}
}

export async function asyncFind<T>(
	array: T[],
	callbackfn: (value: T, index: number, array: T[]) => Promise<unknown> | unknown,
) {
	const cooldown = nextTickIteration(10);

	let i = 0;

	while (i < array.length) {
		await cooldown();

		const result = await callbackfn(array[i], i, array);

		if (Boolean(result)) {
			return array[i];
		}

		i++;
	}

	return undefined;
}

export function isPromise<T = void>(value: any): value is Promise<T> {
	return (
		value &&
		typeof value === 'object' &&
		'then' in value &&
		'catch' in value &&
		typeof value.then === 'function' &&
		typeof value.catch === 'function'
	);
}
