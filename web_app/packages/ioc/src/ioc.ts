import ServiceContainer from './ServiceContainer.js';

/**
 * This interface can be augmented by users to add types to ioc
 */
interface IocMap {}

export function ioc<Key extends keyof IocMap>(id: Key): IocMap[Key] {
	return ServiceContainer.get(id as any) as any;
}
export type { IocMap };
