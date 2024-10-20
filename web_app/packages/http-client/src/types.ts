import type { OverwriteWith } from '@cultura-ai/types';

export type BodyInit = globalThis.RequestInit['body'];
export type Response = globalThis.Response;
export type RequestRedirect = globalThis.Request['redirect'];
export type ReferrerPolicy = globalThis.Request['referrerPolicy'];

export type HttpRequestConfig<TExtends = any> = OverwriteWith<
	{
		url: string;
		method: string;
		params?: Record<string, any>;
		body?: any;
		headers?: Record<string, string>;
		keepalive?: boolean;
		redirect?: RequestRedirect;
		signal?: AbortSignal;
		referrer?: string;
		referrerPolicy?: ReferrerPolicy;
	},
	TExtends
>;

export type HttpResponse<TExtends = any> = globalThis.Response &
	OverwriteWith<
		{
			config: HttpRequestConfig;
			data: any;
		},
		TExtends
	>;

export type MaybeFullResponse<T, TExtends = any> = T extends true
	? HttpResponse<TExtends>
	: HttpResponse<TExtends> extends { data: any }
		? HttpResponse<TExtends>['data']
		: never;
