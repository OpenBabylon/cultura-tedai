import { hasInjectionContext, inject, provide, withAppInject } from '@cultura-ai/node-inject';
import type { AnyFunction } from '@cultura-ai/types';

import { ServiceActor, type ServiceActorParams } from './ServiceActor.js';

export * from './ServiceActor.js';

const SYM_SERVICE_ACTOR = Symbol.for('app.service.actor');

export function createServiceActor<T extends object = Record<string, any>>(
	params: ServiceActorParams<T>,
): ServiceActor<T> {
	return new ServiceActor(params);
}

/**
 * Returns service actor instance from async context
 */
export function injectServiceActor(): ServiceActor | undefined {
	const actor = hasInjectionContext() ? inject(SYM_SERVICE_ACTOR) : undefined;

	if (!ServiceActor.Is(actor)) {
		return undefined;
	}

	return actor;
}

/**
 * Returns service actor instance from async context or create and bind to async context
 */
export function useServiceActor(defParams?: ServiceActorParams): ServiceActor {
	let actor = injectServiceActor();

	if (!ServiceActor.Is(actor)) {
		// Create new actor and bind to async context
		actor = new ServiceActor(defParams);
		provide(SYM_SERVICE_ACTOR, actor, true);
	}

	return actor;
}

/**
 * Create service actor and run provided function in async context
 */
export async function withServiceActor<T extends AnyFunction>(
	params: ServiceActorParams,
	fn: T,
): Promise<ReturnType<Awaited<T>>> {
	const next = () => {
		const actor = new ServiceActor(params);

		provide(SYM_SERVICE_ACTOR, actor);
		return fn();
	};

	if (hasInjectionContext()) {
		return next();
	}

	return withAppInject(next);
}

/**
 * Run provided function in isolated context but keep the same trace id
 */
export async function childServiceActor<T extends AnyFunction>(
	params: ServiceActorParams,
	fn: T,
): Promise<ReturnType<Awaited<T>>> {
	const parent = injectServiceActor();

	const next = () => {
		const actor = new ServiceActor({
			...params,
			traceId: params.traceId || parent?.traceId,
		});

		provide(SYM_SERVICE_ACTOR, actor);

		return fn();
	};

	return withAppInject(next);
}
