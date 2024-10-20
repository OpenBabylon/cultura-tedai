import { crc32, def, isNumber } from '@cultura-ai/shared';
import type { Awaitable } from '@cultura-ai/types';

export type RpcContext<TExtends extends object = object> = {
	requestId: number;
} & TExtends;

export type RpcHandler<TContext extends RpcContext = RpcContext> = (
	ctx: TContext,
	...args: any[]
) => Awaitable<unknown>;

const SYM_RPC_HANDLER = Symbol('rpc.handler');

export function createRpcHandlerDefiner<T extends RpcHandler<any>>(): (fn: T) => T {
	return (fn: T) => defineRpcHandler(fn);
}

export function defineRpcHandler<T extends RpcHandler>(fn: T): T {
	def(fn, SYM_RPC_HANDLER, true);
	return fn;
}

export function isRpcHandler(value: unknown): value is RpcHandler {
	return (value as any)?.[SYM_RPC_HANDLER] === true;
}

export class RpcRegister<TContext extends RpcContext = RpcContext> {
	protected _methods = new Map<number, RpcHandler<TContext>>();

	/**
	 * Go trough defined handlers and setup it
	 */
	protected _setupMethods() {
		for (const [key, value] of Object.entries(this)) {
			if (isRpcHandler(value)) {
				this.defineMethod(key, value.bind(this));
			}
		}
	}

	defineMethod(methodName: string, handler: RpcHandler<TContext>) {
		const methodId = crc32(methodName);

		this._methods.set(methodId, handler);
	}

	getHandler(method: string | number): RpcHandler<TContext> | null {
		const methodId = isNumber(method) ? method : crc32(method);

		return this._methods.get(methodId) ?? null;
	}
}
