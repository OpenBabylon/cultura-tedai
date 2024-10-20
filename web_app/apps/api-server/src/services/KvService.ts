import { KeyValue } from '@/models/KeyValue.js';

export class KvService {
	async get<T = unknown>(key: string): Promise<T | null> {
		const doc = await KeyValue.findById(key).lean();

		return (doc?.v as T) ?? null;
	}

	async set<T = unknown>(key: string, value: T): Promise<void> {
		await KeyValue.updateOne(
			{
				_id: key,
			},
			{
				$set: { v: value },
			},
			{
				upsert: true,
			},
		);
	}
}

export const kvService = new KvService();
