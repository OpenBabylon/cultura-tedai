import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	const { producerId } = request;
	const producer = peer.data.producers.get(producerId);

	if (!producer) throw new Error(`producer with id "${producerId}" not found`);

	const stats = await producer.getStats();

	return stats;
});
