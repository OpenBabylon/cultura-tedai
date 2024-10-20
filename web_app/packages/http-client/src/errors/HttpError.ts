import { isError } from '@cultura-ai/shared';

import type { HttpRequestConfig, HttpResponse } from '../types.js';

type ErrorOptions = Parameters<typeof Error>[1];

export default class HttpError extends Error {
	public statusCode: number;
	public code: string;
	public request: HttpRequestConfig | null = null;
	public response: HttpResponse | null = null;

	constructor(message?: string, statusCode?: number, code?: string, options?: ErrorOptions) {
		super(message, options);

		this.name = 'HttpError';
		this.statusCode = statusCode ?? -1;
		this.code = code ?? 'NO_CODE';
	}

	toJSON() {
		return {
			message: this.message,
			statusCode: this.statusCode,
			code: this.code,
		};
	}

	toString() {
		return `${this.name}(${this.statusCode}, ${this.code}, ${this.message})`;
	}

	static is(err: any): err is HttpError {
		return isError(err) && 'name' in err && err.name === 'HttpError';
	}
}
