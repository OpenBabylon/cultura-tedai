import { type InjectionKey, getCurrentInstance, inject } from 'vue';

export function injectWithSelf<T>(
	symbol: InjectionKey<T>,
	def: T | undefined = undefined,
): T | undefined {
	const vm = getCurrentInstance() as any;

	return vm?.provides[symbol as any] || inject(symbol, def);
}
