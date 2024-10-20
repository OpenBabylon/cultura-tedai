import { EventEmitter } from 'node:events';

import {
	type AnyMessage,
	type MessageNotify,
	type MessageRequest,
	Transport,
} from '@cultura-ai/proto';
import type { AnyFunction, Data } from '@cultura-ai/types';
import type uWS from '@cultura-ai/uws';

import { type ProtoRpcContext, ProtoRpcRegister } from './ProtoRpcRegister';

export class ProtoPeer<TData extends object = Data> extends Transport<
	ProtoRpcContext<ProtoPeer<TData>>
> {
	private _emitter = new EventEmitter();

	constructor(
		public readonly id: string,
		private readonly _socket: uWS.WebSocket<any>,
		protected rpcRegister: ProtoRpcRegister<ProtoPeer<TData>>,
		public data: TData,
	) {
		super(rpcRegister);
	}

	on(name: string, listener: AnyFunction) {
		this._emitter.on(name, listener);
	}

	once(name: string, listener: AnyFunction) {
		this._emitter.once(name, listener);
	}

	_createRpcContext(msg: MessageRequest): ProtoRpcContext<ProtoPeer<TData>> {
		return {
			requestId: msg.seq,
			peer: this,
		};
	}

	_write(data: string): Promise<void> {
		try {
			this._socket.send(data, false);
		} catch (_) {}

		return Promise.resolve();
	}

	_close(): Promise<void> {
		try {
			this._socket.close();
		} catch (_) {}

		return Promise.resolve();
	}

	_onRead(msg: AnyMessage): Promise<void> {
		this._emitter.emit('message', msg);
		return Promise.resolve();
	}

	_onNotify(msg: MessageNotify): Promise<void> {
		this._emitter.emit('notify:*', msg);
		this._emitter.emit('notify:' + msg.name, msg);
		return Promise.resolve();
	}

	_onError(error: unknown): void {
		this._emitter.emit('error', error);
	}

	_onClose(): Promise<void> {
		this._emitter.emit('close');
		return Promise.resolve();
	}
}
