import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	const { transportId } = request;
	const transport = peer.data.transports.get(transportId);

	if (!transport) throw new Error(`transport with id "${transportId}" not found`);

	// @ts-ignore
	const iceParameters = await transport.restartIce();

	return iceParameters;
});
