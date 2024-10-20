import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	const { transportId, dtlsParameters } = request;
	const transport = peer.data.transports.get(transportId);

	if (!transport) throw new Error(`transport with id "${transportId}" not found`);

	await transport.connect({ dtlsParameters });

	return true;
});
