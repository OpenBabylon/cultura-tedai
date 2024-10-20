import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { onShutdown, onShutdownError } from '@cultura-ai/graceful-shutdown';
import { ServiceContainer, ioc } from '@cultura-ai/ioc';
import { createLogger } from '@cultura-ai/logger';
import { env } from '@cultura-ai/shared';

const log = createLogger(import.meta);

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function main() {
	await ServiceContainer.setup({
		pathRoot: __dirname,
		typeOutput: path.resolve(__dirname, '../ioc.d.ts'),
		generateTypes: env.isDevelopment,
	});

	const mediasoupService = ioc('Mediasoup');

	await mediasoupService.init();

	onShutdown('mediasoup', () => {
		log.warn('graceful: mediasoup.');
		mediasoupService.shutdown();
	});

	log.info('Start mediasoup workers: %d', mediasoupService.workers.length);

	for (const worker of mediasoupService.workers) {
		log.info('Worker dump [pid:%d]', worker.pid);
	}

	const wsServer = ioc('WsServer');

	const listenInfo = await await wsServer.listen();

	log.info('Start ws-server on ws://%s:%s', listenInfo.host, listenInfo.port);

	onShutdown('ws-server', () => {
		log.warn('graceful: ws-server.');
		wsServer.shutdown();
	});

	onShutdownError((err) => log.error('Graceful shutdown error', err));
}

main().catch((err) => {
	log.error(err);
	process.exit(1);
});
