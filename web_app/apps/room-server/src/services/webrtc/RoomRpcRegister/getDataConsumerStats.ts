import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	const { dataConsumerId } = request;
	const dataConsumer = peer.data.dataConsumers.get(dataConsumerId);

	if (!dataConsumer) throw new Error(`dataConsumer with id "${dataConsumerId}" not found`);

	const stats = await dataConsumer.getStats();

	return stats;
});
