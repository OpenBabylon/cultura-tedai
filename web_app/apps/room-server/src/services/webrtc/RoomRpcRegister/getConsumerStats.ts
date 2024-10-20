import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	const { consumerId } = request;
	const consumer = peer.data.consumers.get(consumerId);

	if (!consumer) throw new Error(`consumer with id "${consumerId}" not found`);

	const stats = await consumer.getStats();

	return stats;
});
