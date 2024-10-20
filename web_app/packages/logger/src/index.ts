import { pino } from 'pino';

import path from 'node:path';
import { URL } from 'node:url';

import { cloneDeepWith, env, isError, isObject } from '@cultura-ai/shared';
import type { Logger } from '@cultura-ai/types';

const LOG_LEVEL = env.string('LOG_LEVEL', 'info');

const parentLogger = pino(createLoggerOptions());

const secure = createSecure(['email', 'password', 'authorization']);

export function createLogger(meta: any, name?: string): Logger {
	// compute label by module filename
	// last two level of path
	if (!name) {
		name = new URL('', meta.url).pathname.split(path.sep).slice(-2).join(path.sep);
	}

	const log = parentLogger.child({ name });

	return log as Logger;
}

export function createLoggerOptions(): pino.LoggerOptions {
	return {
		base: {},
		level: LOG_LEVEL,
		nestedKey: 'payload',
		transport:
			env.isDevelopment || env.isTest
				? {
						target: 'pino-pretty',
						options: {
							colorize: true,
							// in this way, we disable timestamp from log output
							timestampKey: 'time2',
						},
					}
				: undefined,
		serializers: {
			// empty
			error: pino.stdSerializers.errWithCause,
			err: pino.stdSerializers.errWithCause,
			payload(obj: any) {
				return cloneDeepWith(obj, (originValue) => {
					switch (true) {
						case isError(originValue): {
							return {
								...(toObject(originValue) || {}),
								...pino.stdSerializers.err(originValue),
							};
						}

						case originValue?._bsontype === 'ObjectId':
							return originValue.toString();
					}
				});
			},
		},
		hooks: {
			logMethod(inputArgs: any, method: any) {
				inputArgs = inputArgs.map(secure);

				// Bind last object argument as first pino mergingObject argument
				if (
					inputArgs.length >= 2 &&
					inputArgs[inputArgs.length - 1] &&
					typeof inputArgs[inputArgs.length - 1] === 'object'
				) {
					const mergingObject = inputArgs[inputArgs.length - 1];

					inputArgs.pop();
					inputArgs.unshift(mergingObject);
				}

				return method.apply(this, inputArgs);
			},
		},
	};
}

function toObject(value: any) {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return { ...value };
	}

	return isObject(value) ? { ...value } : null;
}

/**
 * @template [T=unknown]
 * @param {string[]} properties
 * @return {<T>(obj: T) => T}
 */
function createSecure(properties: string[]): <T>(obj: T) => T {
	const replaceWith = `<** secure **>`;
	const circular = `<** circular **>`;
	const propertiesSet = Object.freeze(new Set(properties.map((v) => v.toLocaleLowerCase())));
	const processed = new WeakSet();

	const shouldBeHandled = (value: any) =>
		isObject(value) || isError(value) || value instanceof Response;

	const handleObject = (obj: any): any => {
		if (processed.has(obj)) return circular;
		if (!shouldBeHandled(obj)) return obj;

		processed.add(obj);

		const result: any = {};

		if (isError(obj)) {
			result.message = obj.message;
			result.stack = obj.stack;
			result.name = obj.name;
		}

		for (let [key, value] of Object.entries(obj)) {
			if (propertiesSet.has(key.toLowerCase())) {
				value = replaceWith;
			} else if (shouldBeHandled(value)) {
				value = handleObject(value as any);
			}

			result[key] = value;
		}

		return result;
	};

	return handleObject;
}
