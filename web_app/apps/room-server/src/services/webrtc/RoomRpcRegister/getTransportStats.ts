import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	const { transportId } = request;
	const transport = peer.data.transports.get(transportId);

	if (!transport) throw new Error(`transport with id "${transportId}" not found`);

	const stats = await transport.getStats();

	return stats;
});
