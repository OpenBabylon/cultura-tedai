import { defineHandler } from './utils';

export default defineHandler(async function ({ room }, request) {
	const { secret, ...params } = request;

	if (!secret || secret !== process.env.NETWORK_THROTTLE_SECRET) {
		throw new Error('operation NOT allowed, modda fuckaa');
	}

	await room.resetNetworkThrottle();

	return true;
});
