import { type Defer, crc32, defer, isPromise, toError } from '@cultura-ai/shared';

import { type RpcContext, RpcRegister } from './RpcRegister.js';
import {
	type AnyMessage,
	type MessageNotify,
	type MessageRequest,
	type MessageResponseError,
	type MessageResponseSuccess,
	MessageType,
	createMessage,
	parseMessage,
	parseMessageType,
	stringifyMessage,
} from './message.js';

const DEF_TIMEOUT_MS = 15 * 1000;

export interface TransportRequest {
	seq: number;
	methodId: number;
	timeout: number;
	resolved: boolean;
	defer: Defer<MessageResponseSuccess<any> | MessageResponseError>;
}

export class Transport<TRpcContext extends RpcContext = RpcContext> {
	protected _seqId: number = 0;
	protected _closed: boolean = false;
	protected _ready: boolean = false;
	protected _requests = new Map<number, TransportRequest>();
	protected _requestTimeoutMs: number = DEF_TIMEOUT_MS;

	constructor(protected rpcRegister: RpcRegister<TRpcContext>) {}

	ready() {
		if (this._ready) return;
		this._ready = true;
		this._onReady();
	}

	write(message: AnyMessage): Promise<void> {
		this._onWrite(message);
		return this._write(stringifyMessage(message));
	}

	notify(name: string, data: unknown): void {
		const msg = createMessage(MessageType.Notify, {
			name,
			data,
			payload: [],
		});

		this.write(msg);
	}

	async callSafe<TData = unknown>(
		methodName: string,
		...args: unknown[]
	): Promise<MessageResponseSuccess<TData>> {
		const response = await this.call<TData>(methodName, ...args);

		if (response.type === MessageType.ResponseError) {
			const err = new Error(response.message);
			// @ts-ignore
			err.code = response.code;
			throw err;
		}

		return response;
	}

	call<TData = unknown>(
		methodName: string,
		...args: unknown[]
	): Promise<MessageResponseSuccess<TData> | MessageResponseError> {
		const request = createMessage(MessageType.Request, {
			methodId: crc32(methodName),
			seq: ++this._seqId,
			args,
			payload: [],
		});

		try {
			this._onCall(request, methodName);
		} catch (err) {
			this._onError(err);
		}

		const q = defer<MessageResponseSuccess<TData> | MessageResponseError>();

		const timeout = setTimeout(
			this.onRequestTimeout.bind(this, request.seq),
			this._requestTimeoutMs,
		) as any;

		this._requests.set(request.seq, {
			defer: q,
			seq: request.seq,
			timeout,
			methodId: request.methodId,
			resolved: false,
		});

		this.write(request);

		return q.promise;
	}

	async close(): Promise<void> {
		if (this._closed) return;

		this._closed = true;

		try {
			for (const seqId of this._requests.keys()) {
				this.onRequestCancelled(seqId);
			}

			await this._close();
			await this._onClose();
		} catch (error) {
			this._onError(error);
		}
	}

	get closed(): boolean {
		return this._closed;
	}

	private onRequestCancelled(seqId: number): void {
		const req = this._requests.get(seqId);

		if (!req) return;

		this.onMessage(
			createMessage(MessageType.ResponseError, {
				seq: req.seq,
				code: 499,
				message: 'canceled',
				payload: [],
			}),
		);
	}

	private onRequestTimeout(seqId: number): void {
		const req = this._requests.get(seqId);

		if (!req) return;

		this.onMessage(
			createMessage(MessageType.ResponseError, {
				seq: req.seq,
				code: 408,
				message: 'timeout',
				payload: [],
			}),
		);
	}

	private onResponse(msg: MessageResponseSuccess | MessageResponseError): void {
		const req = this._requests.get(msg.seq);

		if (!req) return;
		if (req.resolved) return;

		clearTimeout(req.timeout);

		req.resolved = true;
		req.defer.resolve(msg);
	}

	private onNotify(msg: MessageNotify): void {
		try {
			this._onNotify(msg).catch(this._onError.bind(this));
		} catch (err) {
			this._onError(err);
		}
	}

	private onRequest(request: MessageRequest): void {
		const handler = this.rpcRegister.getHandler(request.methodId);

		if (!handler) {
			const notFound = createMessage(MessageType.ResponseError, {
				seq: request.seq,
				code: 404,
				message: 'unknown method',
				payload: [],
			});

			this.write(notFound);
			return;
		}

		const context = this._createRpcContext(request);

		const onSuccess = (data: any) => {
			const response = createMessage(MessageType.ResponseSuccess, {
				seq: request.seq,
				data,
				payload: [],
			});

			this.write(response);
		};

		const onError = (error: unknown) => {
			const err = toError(error, 'internal error');

			const response = createMessage(MessageType.ResponseError, {
				seq: request.seq,
				code: 500,
				message: err.message,
				payload: [],
			});

			this._onError(err);
			this.write(response);
		};

		try {
			const result = handler(context, ...request.args);

			if (isPromise(result)) {
				result.then(onSuccess).catch(onError);
			} else {
				onSuccess(result);
			}
		} catch (err) {
			onError(err);
		}
	}

	private onMessage(msg: AnyMessage): void {
		switch (msg.type) {
			case MessageType.ResponseError: {
				this.onResponse(msg);
				break;
			}

			case MessageType.ResponseSuccess: {
				this.onResponse(msg);
				break;
			}

			case MessageType.Request: {
				this.onRequest(msg);
				break;
			}

			case MessageType.Notify: {
				this.onNotify(msg);
				break;
			}
		}
	}

	_createRpcContext(msg: MessageRequest): TRpcContext {
		return {
			requestId: msg.seq,
		} as TRpcContext;
	}

	/**
	 * Basic incoming data handling
	 */
	_read(data: string) {
		try {
			const msg = parseMessage(data);
			const anyMessage = parseMessageType(msg);

			try {
				this._onRead(anyMessage).catch(this._onError.bind(this));
			} catch (err) {
				this._onError(err);
			}

			this.onMessage(anyMessage);
		} catch (err) {
			this._onError(err);
		}
	}

	_write(data: string): Promise<void> {
		return Promise.reject(new Error('._write method not implemented'));
	}

	_close(): Promise<void> {
		return Promise.reject(new Error('._close method not implemented'));
	}

	/**
	 * Overridable hook
	 */
	_onReady(): void {}

	/**
	 * Overridable hook
	 */
	_onClose(): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Overridable hook
	 */
	_onRead(msg: AnyMessage): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Overridable hook
	 */
	_onWrite(msg: AnyMessage): void {
		return;
	}

	/**
	 * Overridable hook
	 */
	_onNotify(msg: MessageNotify): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Overridable hook
	 */
	_onCall(msg: MessageRequest, methodName: string) {}

	/**
	 * Overridable error handler
	 */
	_onError(error: unknown): void {
		console.error(error);
	}
}
