import { ServiceContainer } from '@cultura-ai/ioc';
import { deepClone } from '@cultura-ai/shared';

const MEM_STORAGE = new Map();

export class KeyValueService {
	async get<T = unknown>(key: string): Promise<T | null> {
		return deepClone(MEM_STORAGE.get(key));
	}

	async set<T = unknown>(key: string, value: T): Promise<void> {
		MEM_STORAGE.set(key, value);
	}
}

ServiceContainer.set('KeyValue', () => new KeyValueService());
