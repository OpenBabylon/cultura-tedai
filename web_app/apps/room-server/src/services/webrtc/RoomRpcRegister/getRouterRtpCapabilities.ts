import { defineHandler } from './utils';

export default defineHandler(function ({ room }) {
	return room.getRouterRtpCapabilities();
});
