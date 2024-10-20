import type { FastifyPluginCallback } from 'fastify';

import room from './room.js';

const plugin: FastifyPluginCallback = (fastify, opts, done) => {
	room(fastify);
	done();
};

export { plugin as default };
