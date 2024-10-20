import mediasoup from 'mediasoup';

import assert from 'node:assert';

import { ServiceContainer } from '@cultura-ai/ioc';
import { createLogger } from '@cultura-ai/logger';
import { deepClone } from '@cultura-ai/shared';
import type { Logger } from '@cultura-ai/types';

import config from '@/config';

import { Room } from './webrtc/Room';

export interface MediasoupOptions {
	logger?: Logger;
	numWorkers: number;
	useWebrtcServer: boolean;
	workerSettings: mediasoup.types.WorkerSettings;
	webRtcServerOptions: mediasoup.types.WebRtcServerOptions;
}

export class MediasoupService {
	private log: Logger;
	private _workers: mediasoup.types.Worker[] = [];
	private _rooms: Map<string, Room> = new Map();
	private options: Omit<MediasoupOptions, 'logger'>;
	private initialized = false;
	public isShutdown = false;
	private nextMediasoupWorkerIdx = 0;

	constructor({ logger = createLogger(import.meta, 'mediasoup'), ...options }: MediasoupOptions) {
		this.log = logger;
		this.options = options;
	}

	get workers() {
		return [...this._workers];
	}

	shutdown() {
		this.isShutdown = true;

		for (const worker of this._workers) {
			worker.close();
		}
	}

	async getOrCreateRoom({
		roomId,
		consumerReplicas,
	}: {
		roomId: string;
		consumerReplicas: number;
	}): Promise<Room> {
		let room = this._rooms.get(roomId);

		if (!room) {
			this.log.info('creating a new Room [roomId:%s]', roomId);

			const mediasoupWorker = this.getWorkerRoundRobin();

			room = await Room.create({ mediasoupWorker, roomId, consumerReplicas });

			this._rooms.set(roomId, room);
			room.on('close', () => this._rooms.delete(roomId));
		}

		return room;
	}

	getWorkerRoundRobin(): mediasoup.types.Worker {
		const worker = this._workers[this.nextMediasoupWorkerIdx];

		if (++this.nextMediasoupWorkerIdx === this._workers.length) {
			this.nextMediasoupWorkerIdx = 0;
		}

		return worker;
	}

	async init() {
		if (this.initialized) return;

		const { numWorkers, useWebrtcServer, webRtcServerOptions, workerSettings } = this.options;

		for (let i = 0; i < numWorkers; ++i) {
			const worker = await mediasoup.createWorker(workerSettings);

			worker.on('died', () => {
				if (this.isShutdown) return;
				this.log.error('mediasoup Worker died, exiting  in 2 seconds... [pid:%d]', worker.pid);
				setTimeout(() => process.exit(1), 2000);
			});

			this._workers.push(worker);

			// Create a WebRtcServer in this Worker.
			if (useWebrtcServer) {
				// Each mediasoup Worker will run its own WebRtcServer, so those cannot
				// share the same listening ports. Hence we increase the value in config.js
				// for each Worker.
				const serverOptions = deepClone(webRtcServerOptions);
				const portIncrement = this._workers.length - 1;

				for (const listenInfo of serverOptions.listenInfos) {
					assert.ok(listenInfo.port, 'listenInfo.port expected number');
					listenInfo.port += portIncrement;
				}

				const webRtcServer = await worker.createWebRtcServer(serverOptions);

				worker.appData.webRtcServer = webRtcServer;
			}
		}
	}
}

ServiceContainer.set('Mediasoup', () => {
	return new MediasoupService({
		numWorkers: config.mediasoup.numWorkers,
		useWebrtcServer: config.mediasoup.useWebrtcServer,
		webRtcServerOptions: config.mediasoup.webRtcServerOptions,
		workerSettings: config.mediasoup.workerSettings,
	});
});
