import cors from '@fastify/cors';
import Fastify from 'fastify';
// @ts-ignore
import { serializers } from 'fastify/lib/logger.js';

import { onShutdown, onShutdownError } from '@cultura-ai/graceful-shutdown';
import { createLogger, createLoggerOptions } from '@cultura-ai/logger';
import { deepAssign, env } from '@cultura-ai/shared';

import { setupMongooseConnections } from './lib/mongoose.js';
import apiV1 from './routes/v1/index.js';

const PORT = env.int('PORT', 3000);
const HOST = env.string('HOST', '::');

const log = createLogger(import.meta);

async function main() {
	await setupMongooseConnections();

	const logger = createLoggerOptions();
	delete logger.hooks;

	deepAssign(logger, {
		serializers,
	});

	const fastify = Fastify({
		logger,
	});

	await fastify.register(cors);

	onShutdown('http-server', () => {
		log.warn('graceful: http-server.');
		fastify.close();
	});

	onShutdownError((err) => log.error('Graceful shutdown error', err));

	fastify.register(apiV1, { prefix: '/api/v1' });

	// Run the server!
	try {
		await fastify.listen({ port: PORT, host: HOST });
	} catch (err) {
		log.error(err);
		process.exit(1);
	}
}

main().catch(console.error);
