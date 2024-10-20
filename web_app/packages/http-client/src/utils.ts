import { isEmpty } from '@cultura-ai/shared';

import type { HttpRequestConfig } from './types.js';

export function setHeader(config: HttpRequestConfig, key: string, value: string) {
	if (!config.headers) config.headers = {};

	config.headers[key] = value;
}

export function buildUri(baseURL: string, config: HttpRequestConfig) {
	let uri = config.url.endsWith('/') ? config.url.slice(1) : config.url;

	if (!uri.startsWith('http')) {
		const endpoint = baseURL.startsWith('/') ? baseURL.slice(1) : baseURL;
		uri = endpoint + '/' + uri;
	}

	if (!isEmpty(config.params)) {
		uri = `${uri}?${qs.stringify(config.params!)}`;
	}

	return uri;
}

export function isJsonContentType(contentType?: string | null) {
	return contentType?.startsWith('application/json') ?? false;
}

export function isPlainTextContentType(contentType?: string | null) {
	return contentType?.includes('text/plain') ?? false;
}

export function isFormDataContentType(contentType?: string | null) {
	return contentType?.startsWith('application/x-www-form-urlencoded') ?? false;
}

export function isJsonHeader(headers?: Record<string, string>) {
	return isJsonContentType(headers?.['Content-Type']);
}

export function isFormDataHeader(headers?: Record<string, string>) {
	return isFormDataContentType(headers?.['Content-Type']);
}

export const qs = {
	stringify(obj: Record<string, any>) {
		const normalized: Record<string, string> = {};

		for (const [key, value] of Object.entries(obj)) {
			if (isEmpty(value)) continue;
			normalized[key] = this.stringifyValue(value);
		}

		return new URLSearchParams(normalized).toString();
	},

	stringifyValue(value: any) {
		const type = this.getValueType(value);

		switch (type) {
			case 'array':
				return value.join(',');

			case 'date':
				return value.toISOString();

			case 'null':
			case 'undefined':
				return value;

			default:
				return String(value);
		}
	},

	getValueType(value: any) {
		if (value === null) {
			return 'null';
		} else if (value === undefined) {
			return 'undefined';
		}

		return Array.isArray(value) ? 'array' : value instanceof Date ? 'date' : typeof value;
	},

	castValue(type: string, value: any) {
		switch (type) {
			case 'date':
				return new Date(value);
			case 'number':
				return parseFloat(value);
			case 'array':
				return value.split(',');
			case 'boolean':
				return value === 'true';
			default:
				return value;
		}
	},
};

export function requestConfigToFetchRequest(config: HttpRequestConfig): RequestInit {
	const request: RequestInit = {
		method: String(config.method).toUpperCase(),
		keepalive: config.keepalive,
		redirect: config.redirect,
		referrerPolicy: config.referrerPolicy,
		signal: config.signal,
		headers: {
			Accept: 'application/json',
			...config.headers,
		},
	};

	const requestHeaders = request.headers as Record<string, string>;

	if (config.body !== undefined) {
		if (!requestHeaders['Content-Type']) {
			requestHeaders['Content-Type'] = 'application/json';
		}

		if (isJsonContentType(requestHeaders['Content-Type'])) {
			request.body = JSON.stringify(config.body);
		} else {
			request.body = config.body as any;
		}
	}

	return request;
}
