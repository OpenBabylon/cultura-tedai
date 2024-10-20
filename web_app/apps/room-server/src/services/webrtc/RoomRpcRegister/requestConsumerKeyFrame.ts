import { defineHandler } from './utils';

export default defineHandler(async function ({ peer }, request) {
	// Ensure the Peer is joined.
	if (!peer.data.joined) throw new Error('Peer not yet joined');

	const { consumerId } = request;
	const consumer = peer.data.consumers.get(consumerId);

	if (!consumer) throw new Error(`consumer with id "${consumerId}" not found`);

	await consumer.requestKeyFrame();
});
