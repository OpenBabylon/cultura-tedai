import { deepAssign, logger, randomString } from '@cultura-ai/shared';
import type { Logger } from '@cultura-ai/types';

import HttpError from './errors/HttpError.js';
import type { HttpRequestConfig, HttpResponse, MaybeFullResponse } from './types.js';
import {
	buildUri,
	isFormDataContentType,
	isJsonContentType,
	isPlainTextContentType,
	requestConfigToFetchRequest,
} from './utils.js';

export interface HttpClientOptions {
	name: string;
	basePath: string;
	baseConfig?: Partial<HttpRequestConfig>;
	logger?: Logger;
	logRequest?: boolean;
	logResponse?: boolean;
}

const randomUUID = () => {
	return crypto
		? crypto.randomUUID()
		: `${randomString(6)}-${randomString(5)}-${randomString(4)}-${randomString(4)}`;
};

export class HttpClient<ExtendsRequest extends object = any, ExtendsResponse extends object = any> {
	protected _name: string;
	protected _log: Logger;
	protected _logRequest: boolean;
	protected _logResponse: boolean;
	protected _basePath: string;
	protected readonly _baseConfig: Partial<HttpRequestConfig>;

	constructor({
		logger: _logger,
		baseConfig,
		basePath,
		name,
		logRequest,
		logResponse,
	}: HttpClientOptions) {
		this._name = name || 'http-client';
		this._log = _logger || logger(this._name);
		this._logRequest = logRequest ?? true;
		this._logResponse = logResponse ?? true;
		this._basePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
		this._baseConfig = Object.freeze(baseConfig || {});
	}

	async _parseResponse(response: Response) {
		const contentType = response.headers.get('Content-Type');

		if (isJsonContentType(contentType)) {
			return await response.json();
		} else if (isPlainTextContentType(contentType)) {
			return await response.text();
		} else if (isFormDataContentType(contentType)) {
			return Object.fromEntries((await response.formData()).entries());
		}

		return response;
	}

	async call<TData = any, TFullResponse extends boolean = true>(
		config: HttpRequestConfig<ExtendsRequest>,
		fullResponse?: TFullResponse,
	): Promise<MaybeFullResponse<TFullResponse, Omit<ExtendsResponse, 'data'> & { data: TData }>> {
		const reqConfig: HttpRequestConfig = {
			method: '',
			url: '',
			headers: {},
			params: {},
		};

		deepAssign(reqConfig, this._baseConfig);
		deepAssign(reqConfig, config);

		const requestUid = randomUUID();
		const uri = buildUri(this._basePath, reqConfig);

		if (this._logRequest) {
			this._log.info('[%s] REQUEST -> %s: %s', requestUid, reqConfig.method, uri, {
				body: reqConfig.body,
			});
		}

		try {
			const res = await this._dispatchRequest(reqConfig);

			if (this._logResponse) {
				this._log.info(
					'[%s] RESPONSE <- %s (%d): %s',
					requestUid,
					reqConfig.method,
					res.status,
					uri,
				);
			}

			return fullResponse !== false ? res : res.data;
		} catch (err) {
			if (this._logResponse) {
				if (HttpError.is(err) && err.statusCode >= 400) {
					this._log.error(
						'[%s] RESPONSE <- %s (%d): %s',
						requestUid,
						reqConfig.method,
						err.statusCode,
						uri,
						{ statusCode: err.statusCode, statusText: err.response?.statusText },
					);
				}
			}

			throw err;
		}
	}

	get<TResponseBody = any>(url: string, config?: Partial<HttpRequestConfig<ExtendsRequest>>) {
		return this.call<TResponseBody, false>(
			{
				...(config || {}),
				method: 'GET',
				url,
			} as any,
			false,
		);
	}

	delete<TResponseBody = any>(url: string, config?: Partial<HttpRequestConfig<ExtendsRequest>>) {
		return this.call<TResponseBody, false>(
			{
				...(config || {}),
				method: 'DELETE',
				url,
			} as any,
			false,
		);
	}

	head<TResponseBody = any>(url: string, config?: Partial<HttpRequestConfig<ExtendsRequest>>) {
		return this.call<TResponseBody, false>(
			{
				...(config || {}),
				method: 'HEAD',
				url,
			} as any,
			false,
		);
	}

	options<TResponseBody = any>(url: string, config?: Partial<HttpRequestConfig<ExtendsRequest>>) {
		return this.call<TResponseBody, false>(
			{
				...(config || {}),
				method: 'OPTIONS',
				url,
			} as any,
			false,
		);
	}

	post<TResponseBody = any, TRequestBody = any>(
		url: string,
		data?: TRequestBody,
		config?: Partial<HttpRequestConfig<ExtendsRequest & { body: TRequestBody }>>,
	) {
		return this.call<TResponseBody, false>(
			{
				...(config || {}),
				body: data,
				method: 'POST',
				url,
			} as any,
			false,
		);
	}

	put<TResponseBody = any, TRequestBody = any>(
		url: string,
		data?: TRequestBody,
		config?: Partial<HttpRequestConfig<ExtendsRequest & { body: TRequestBody }>>,
	) {
		return this.call<TResponseBody, false>(
			{
				...(config || {}),
				body: data,
				method: 'PUT',
				url,
			} as any,
			false,
		);
	}

	patch<TResponseBody = any, TRequestBody = any>(
		url: string,
		data?: TRequestBody,
		config?: Partial<HttpRequestConfig<ExtendsRequest & { body: TRequestBody }>>,
	) {
		return this.call<TResponseBody, false>(
			{
				...(config || {}),
				body: data,
				method: 'PATCH',
				url,
			} as any,
			false,
		);
	}

	protected async _dispatchRequest(config: HttpRequestConfig): Promise<HttpResponse> {
		const uri = buildUri(this._basePath, config);
		const req = requestConfigToFetchRequest(config);
		const res = await fetch(uri, req);
		const response: HttpResponse = res as any;

		response.config = config;

		if (res.body) {
			try {
				response.data = await this._parseResponse(response);
			} catch (err) {
				throw err;
			}

			if (!response.ok) {
				const error = new HttpError(response.statusText, response.status);
				error.request = config;
				error.response = response;

				return Promise.reject(error);
			}
		}

		return response;
	}
}
