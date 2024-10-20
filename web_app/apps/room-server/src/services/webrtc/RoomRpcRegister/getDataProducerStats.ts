import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	const { dataProducerId } = request;
	const dataProducer = peer.data.dataProducers.get(dataProducerId);

	if (!dataProducer) throw new Error(`dataProducer with id "${dataProducerId}" not found`);

	const stats = await dataProducer.getStats();

	return stats;
});
