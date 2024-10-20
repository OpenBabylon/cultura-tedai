import type { Logger } from '@cultura-ai/types';

import { env } from './env.js';
import { noop } from './is.js';

const IS_DEV = env.bool('DEV', false) || env.string('MODE') === 'development';

export const logger = (...baseArgs: any[]): Logger => {
	// normalize meta.url
	if (typeof baseArgs[0] === 'string' && baseArgs[0][0] !== '[') {
		baseArgs[0] = `[${baseArgs[0].split('/')!.at(-1)!.split('?', 1)[0]!}]`;
	}

	const log = console.log.bind(console, ...baseArgs);

	const info = console.info.bind(console, ...baseArgs);

	const warn = console.warn.bind(console, ...baseArgs);

	const error = console.error.bind(console, ...baseArgs);

	const debug = console.debug.bind(console, ...baseArgs);

	const extend = (...args: any[]) => {
		return logger(...baseArgs, ...args);
	};

	const instance = {
		log,
		info,
		warn,
		error,
		debug,
		extend,
	};

	Object.defineProperty(instance, 'debug', {
		get: () => (IS_DEV ? debug : noop),
	});

	return instance;
};
