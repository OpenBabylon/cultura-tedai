import { assert, def, isObject } from '@cultura-ai/shared';

const VERSION = 1;
const SYM_MESSAGE = Symbol();

type TypeToMessage = {
	[MessageType.Ping]: MessagePong;
	[MessageType.Pong]: MessagePing;
	[MessageType.Notify]: MessageNotify;
	[MessageType.Request]: MessageRequest;
	[MessageType.ResponseSuccess]: MessageResponseSuccess;
	[MessageType.ResponseError]: MessageResponseError;
};

export enum MessageType {
	Ping,
	Pong,
	Notify,
	Request,
	ResponseSuccess,
	ResponseError,
}

export type AnyMessage =
	| MessagePing
	| MessagePong
	| MessageNotify
	| MessageRequest
	| MessageResponseSuccess
	| MessageResponseError;

export interface Message {
	type: MessageType;
	version: number;
	payload: unknown[];
}

export interface MessagePing extends Message {
	type: MessageType.Ping;
}

export interface MessagePong extends Message {
	type: MessageType.Pong;
}

export interface MessageNotify<TData = unknown> extends Message {
	type: MessageType.Notify;
	name: string;
	data: TData;
}

export interface MessageRequest extends Message {
	type: MessageType.Request;
	methodId: number;
	seq: number;
	args: unknown[];
}

export interface MessageResponseSuccess<TData = unknown> extends Message {
	type: MessageType.ResponseSuccess;
	seq: number;
	data: TData;
}

export interface MessageResponseError extends Message {
	type: MessageType.ResponseError;
	seq: number;
	code: number;
	message: string;
}

export function parseMessage(raw: string): Message {
	let msg: unknown;

	try {
		msg = JSON.parse(raw);
	} catch (_) {
		assert.ok(false, 'failed to parse message json string');
	}

	assert.array(msg, 'expected array.');

	const [version, type, ...payload] = msg;

	assert.number(type, 'expected message type number');
	assert.number(version, 'expected message version number');

	assert.ok(MessageType[type] !== undefined, 'unknown message type: ' + type);
	assert.equal(version, 1, 'unknown message version: ' + version);

	return { version, type, payload };
}

export function stringifyMessage(msg: AnyMessage): string {
	switch (msg.type) {
		case MessageType.Notify: {
			return JSON.stringify([msg.version, msg.type, msg.name, msg.data, ...msg.payload]);
		}

		case MessageType.Request: {
			return JSON.stringify([
				msg.version,
				msg.type,
				msg.methodId,
				msg.seq,
				...msg.args,
				...msg.payload,
			]);
		}

		case MessageType.ResponseSuccess: {
			return JSON.stringify([msg.version, msg.type, msg.seq, msg.data, ...msg.payload]);
		}

		case MessageType.ResponseError: {
			return JSON.stringify([
				msg.version,
				msg.type,
				msg.seq,
				msg.code,
				msg.message,
				...msg.payload,
			]);
		}

		default: {
			return JSON.stringify([
				(msg as Message).version,
				(msg as Message).type,
				...(msg as Message).payload,
			]);
		}
	}
}

export function parseMessageType({ version, type, payload: _payload }: Message): AnyMessage {
	assert.equal(version, 1, 'unknown message version: ' + version);

	switch (type) {
		case MessageType.Notify: {
			const [name, data, ...payload] = _payload;

			assert.notEmptyString(name, 'expected notify name string.');

			return createMessage(MessageType.Notify, {
				name,
				data,
				payload,
			});
		}

		case MessageType.Request: {
			const [methodId, seq, ...args] = _payload;

			assert.number(methodId, 'expected method id number');
			assert.number(seq, 'expected method id number');

			return createMessage(MessageType.Request, {
				methodId,
				seq,
				args,
				payload: [],
			});
		}

		case MessageType.ResponseSuccess: {
			const [seq, data, ...payload] = _payload;

			assert.number(seq, 'expected method id number');

			return createMessage(MessageType.ResponseSuccess, {
				seq,
				data,
				payload,
			});
		}

		case MessageType.ResponseError: {
			const [seq, code, message, ...payload] = _payload;

			assert.number(seq, 'expected method id number');
			assert.number(code, 'expected code number');
			assert.notEmptyString(message, 'expected message string');

			return createMessage(MessageType.ResponseError, {
				seq,
				code,
				message,
				payload,
			});
		}

		default: {
			return createMessage(type, { payload: [] });
		}
	}

	assert.ok(false, 'unknown message type: ' + type);
}

export function createMessage<T extends MessageType>(
	type: T,
	params: Omit<TypeToMessage[T], 'type' | 'version'>,
): TypeToMessage[T] {
	const msg: any = {
		type,
		version: VERSION,
		...params,
	};

	def(msg, SYM_MESSAGE, true);

	return msg;
}

export function isMessage(value: unknown): value is AnyMessage {
	return isObject(value) && (value as any)[SYM_MESSAGE] === true;
}
