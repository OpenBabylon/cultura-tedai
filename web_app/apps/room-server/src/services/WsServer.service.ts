import { ServiceContainer, ioc } from '@cultura-ai/ioc';
import { createLogger } from '@cultura-ai/logger';
import { MessageNotify } from '@cultura-ai/proto';
import type { Logger } from '@cultura-ai/types';
import uWS from '@cultura-ai/uws';

import config from '@/config';

import { ProtoPeer } from './proto/ProtoPeer';

type WebSocketUserData = {
	roomId: string;
	peerId: string;
	peer?: ProtoPeer<any>;
};

export interface WsServerOptions {
	logger?: Logger;
	host: string;
	port: number;
}

export class WsServer {
	private log: Logger;
	private options: Omit<WsServerOptions, 'logger'>;
	private listening = false;
	public app: uWS.TemplatedApp;
	public isShutdown = false;

	constructor({ logger = createLogger(import.meta, 'ws-server'), ...options }: WsServerOptions) {
		this.log = logger;
		this.options = options;

		const Mediasoup = ioc('Mediasoup');

		this.app = uWS
			.App({})
			.ws<WebSocketUserData>('/*', {
				compression: uWS.SHARED_COMPRESSOR,
				maxPayloadLength: 16 * 1024 * 1024,
				idleTimeout: 10,
				async upgrade(res, req, context) {
					const params = new URLSearchParams(req.getQuery());
					const secWebSocketKey = req.getHeader('sec-websocket-key');
					const secWebSocketProtocol = req.getHeader('sec-websocket-protocol');
					const secWebSocketExtensions = req.getHeader('sec-websocket-extensions');

					const roomId = params.get('roomId');
					const peerId = params.get('peerId');

					let aborted = false;

					res.onAborted(() => {
						aborted = true;
					});

					if (!roomId) {
						res.writeStatus('400').write('Connection request without roomId');
						return;
					}

					if (!peerId) {
						res.writeStatus('400').write('Connection request without peerId');
						return;
					}

					await Mediasoup.getOrCreateRoom({
						roomId,
						consumerReplicas: 0,
					});

					res.cork(() => {
						if (aborted) return;
						res.upgrade(
							{ roomId, peerId },
							secWebSocketKey,
							secWebSocketProtocol,
							secWebSocketExtensions,
							context,
						);
					});
				},
				open: async (ws) => {
					const userData = ws.getUserData();

					const room = await Mediasoup.getOrCreateRoom({
						roomId: userData.roomId,
						consumerReplicas: 0,
					});

					const peer = room.handleConnection({
						peerId: userData.peerId,
						socket: ws,
					});

					if (!peer) {
						this.log.warn('Failed to initialize peer, close connection!', userData);
						try {
							ws.close();
						} catch (_) {}
						return;
					}

					userData.peer = peer;

					peer.on('notify:*', (msg: MessageNotify) => {
						this.log.info('[%s] peer received notify: %s', peer.id, msg.name);
					});

					peer.on('error', (err) => {
						this.log.error('[%s] peer error.', peer.id, err);
					});

					this.log.info('[%s] peer connected!', userData.peer.id);
				},
				message: (ws, message, isBinary) => {
					const { peer } = ws.getUserData();

					if (!peer) return;

					if (isBinary) return;

					const content = Buffer.from(message).toString('utf8');

					peer._read(content);
				},
				drain: (ws) => {
					const { peerId } = ws.getUserData();
					this.log.warn('[%s] peer backpressure: %d bytes', peerId, ws.getBufferedAmount());
				},
				close: (ws, code, message) => {
					const { peer, peerId } = ws.getUserData();

					if (peer) peer.close();

					this.log.info('[%s] peer closed!', peerId);
				},
			})
			.any('/*', (res, req) => {
				res.end('Nothing to see here!');
			});
	}

	listen(): Promise<{ host: string; port: number }> {
		if (this.listening) return Promise.reject(new Error('Already listening'));

		const { host, port } = this.options;

		this.listening = true;

		return new Promise((resolve, reject) => {
			this.app.listen(host, port, (token) => {
				if (token) {
					resolve({ host, port });
				} else {
					this.listening = false;
					reject(new Error('Failed to start ws-server on port ' + port));
				}
			});
		});
	}

	shutdown() {
		if (this.isShutdown) return;
		this.isShutdown = true;
		this.app.close();
	}
}

ServiceContainer.set('WsServer', () => {
	return new WsServer({
		host: config.ws.host,
		port: config.ws.port,
	});
});
