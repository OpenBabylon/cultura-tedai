import mediasoup from 'mediasoup';

import EventEmitter from 'node:events';

import { createLogger } from '@cultura-ai/logger';
import { deepClone, toError } from '@cultura-ai/shared';
import type uWS from '@cultura-ai/uws';

import config from '@/config';

import { ProtoPeer } from '../proto/ProtoPeer';
import { ProtoRoom } from '../proto/ProtoRoom';
import { Bot } from './Bot';
import { RoomRpcRegister } from './RoomRpcRegister';

export interface PeerData extends Record<string, any> {
	room: Room;
	joined: boolean;
	displayName?: string | undefined;
	device?: Device | undefined;
	rtpCapabilities?: mediasoup.types.RtpCapabilities | undefined;
	sctpCapabilities?: mediasoup.types.SctpCapabilities | undefined;
	transports: Map<string, mediasoup.types.WebRtcTransport | mediasoup.types.PlainTransport>;
	producers: Map<string, mediasoup.types.Producer>;
	consumers: Map<string, mediasoup.types.Consumer>;
	dataProducers: Map<string, mediasoup.types.DataProducer>;
	dataConsumers: Map<string, mediasoup.types.DataConsumer>;
	consume?: boolean;
}

export interface CreateRoomOptions {
	mediasoupWorker: mediasoup.types.Worker;
	roomId: string;
	consumerReplicas?: number;
}

export interface RoomOptions {
	roomId: string;
	webRtcServer: mediasoup.types.WebRtcServer;
	mediasoupRouter: mediasoup.types.Router;
	audioLevelObserver: mediasoup.types.AudioLevelObserver;
	activeSpeakerObserver: mediasoup.types.ActiveSpeakerObserver;
	consumerReplicas?: number;
	bot: Bot;
}

export type PeerInfo = {
	id: string;
	displayName?: string;
	device?: Device;
	producers: { id: string; kind: string }[];
};

export type Device = {
	flag: string;
	name: string;
	version?: string;
};

export type Broadcaster = {
	id: string;
	data: PeerData;
};

export interface HandleProtoConnection {
	/**
	 * The id of the proto peer to be created.
	 */
	peerId: string;

	/**
	 * Whether this peer wants to consume from others.
	 */
	consume?: boolean;

	socket: uWS.WebSocket<any>;
}

export interface CreateBroadcaster {
	/**
	 * Broadcaster id.
	 */
	id: string;

	/**
	 * Descriptive name.
	 */
	displayName: string;

	/**
	 * Additional info with name, version and flags fields.
	 */
	device?: Partial<Device>;

	/**
	 * Device RTP capabilities.
	 */
	rtpCapabilities: mediasoup.types.RtpCapabilities;
}

export interface CreateBroadcasterTransport {
	broadcasterId: string;

	type: 'plain' | 'webrtc';

	/**
	 * Just for PlainTransport, use RTCP mux.
	 */
	rtcpMux?: boolean;

	/**
	 * Just for PlainTransport, enable remote IP:port
	 */
	comedia?: boolean;

	/**
	 * SCTP capabilities
	 */
	sctpCapabilities?: mediasoup.types.SctpCapabilities;
}

export interface ConnectBroadcasterTransport {
	broadcasterId: string;
	transportId: string;
	dtlsParameters: mediasoup.types.DtlsParameters;
}

export interface CreateBroadcasterProducer {
	broadcasterId: string;
	transportId: string;
	kind: 'audio' | 'video';
	rtpParameters: mediasoup.types.RtpParameters;
}

export interface CreateBroadcasterConsumer {
	broadcasterId: string;
	transportId: string;
	producerId: string;
}

export interface CreateBroadcasterDataConsumer {
	broadcasterId: string;
	transportId: string;
	dataProducerId: string;
}

export interface CreateBroadcasterDataProducer {
	broadcasterId: string;
	transportId: string;
	label?: string;
	protocol?: string;
	sctpStreamParameters?: mediasoup.types.SctpStreamParameters;
	appData?: any;
}

export interface CreateDataConsumer {
	dataConsumerPeer: ProtoPeer<PeerData>;
	dataProducerPeer: Broadcaster | ProtoPeer<PeerData> | null;
	dataProducer: mediasoup.types.DataProducer;
}

export interface CreateConsumer {
	consumerPeer: ProtoPeer<PeerData>;
	producerPeer: ProtoPeer<PeerData> | Broadcaster;
	producer: mediasoup.types.Producer;
}

const log = createLogger(import.meta);

export class Room extends EventEmitter {
	private _roomId: string;
	private _closed: boolean;
	private _protoRoom: ProtoRoom<PeerData>;
	private _broadcasters: Map<string, Broadcaster>;
	private _webRtcServer: mediasoup.types.WebRtcServer<mediasoup.types.AppData>;
	private _mediasoupRouter: mediasoup.types.Router<mediasoup.types.AppData>;
	private _audioLevelObserver: mediasoup.types.AudioLevelObserver<mediasoup.types.AppData>;
	private _activeSpeakerObserver: mediasoup.types.ActiveSpeakerObserver<mediasoup.types.AppData>;
	private _bot: Bot;
	private _consumerReplicas: number;
	private _networkThrottled: boolean;

	/**
	 * Factory function that creates and returns Room instance.
	 */
	static async create({ mediasoupWorker, roomId, consumerReplicas = 0 }: CreateRoomOptions) {
		log.info('create() [roomId:%s]', roomId);

		// Router media codecs.
		const { mediaCodecs } = config.mediasoup.routerOptions;

		// Create a mediasoup Router.
		const mediasoupRouter = await mediasoupWorker.createRouter({ mediaCodecs });

		// Create a mediasoup AudioLevelObserver.
		const audioLevelObserver = await mediasoupRouter.createAudioLevelObserver({
			maxEntries: 1,
			threshold: -80,
			interval: 800,
		});

		// Create a mediasoup ActiveSpeakerObserver.
		const activeSpeakerObserver = await mediasoupRouter.createActiveSpeakerObserver();

		const bot = await Bot.create({ mediasoupRouter });

		return new Room({
			roomId,
			webRtcServer: mediasoupWorker.appData.webRtcServer as any,
			mediasoupRouter,
			audioLevelObserver,
			activeSpeakerObserver,
			consumerReplicas,
			bot,
		});
	}

	constructor({
		roomId,
		webRtcServer,
		mediasoupRouter,
		audioLevelObserver,
		activeSpeakerObserver,
		consumerReplicas = 0,
		bot,
	}: RoomOptions) {
		super();

		this.setMaxListeners(Infinity);

		this._roomId = roomId;

		this._closed = false;

		const rpcRegister = new RoomRpcRegister();

		this._protoRoom = new ProtoRoom<PeerData>(rpcRegister);

		this._broadcasters = new Map();

		this._webRtcServer = webRtcServer;

		this._mediasoupRouter = mediasoupRouter;

		this._audioLevelObserver = audioLevelObserver;

		this._activeSpeakerObserver = activeSpeakerObserver;

		this._bot = bot;

		this._consumerReplicas = consumerReplicas;

		this._networkThrottled = false;

		// Handle audioLevelObserver.
		this._handleAudioLevelObserver();

		// Handle activeSpeakerObserver.
		this._handleActiveSpeakerObserver();

		// If this is the latest Peer in the room, close the room.
		this._protoRoom.on('empty', () => {
			log.info('last Peer in the room left, closing the room [roomId:%s]', this._roomId);
			this.close();
		});
	}

	/**
	 * Closes the Room instance by closing the protoo Room and the mediasoup Router.
	 */
	close() {
		log.debug('close()');

		this._closed = true;

		// Close the protoo Room.
		this._protoRoom.close();

		// Close the mediasoup Router.
		this._mediasoupRouter.close();

		// Close the Bot.
		this._bot.close();

		// Emit 'close' event.
		this.emit('close');

		// Stop network throttling.
		if (this._networkThrottled) {
			log.debug('close() | stopping network throttle');

			// throttle.stop({}).catch((error) => {
			// 	log.error(`close() | failed to stop network throttle:${error}`);
			// });
		}
	}

	logStatus() {
		log.info(
			'logStatus() [roomId:%s, protoo Peers:%s]',
			this._roomId,
			this._protoRoom.peers.length,
		);
	}

	/**
	 * Called from server.js upon a protoo WebSocket connection request from a
	 * browser.
	 */
	handleConnection({ peerId, consume, socket }: HandleProtoConnection): ProtoPeer<PeerData> | null {
		const existingPeer = this._protoRoom.getPeer(peerId);

		if (existingPeer) {
			log.warn(
				'handleProtooConnection() | there is already a protoo Peer with same peerId, closing it [peerId:%s]',
				peerId,
			);

			existingPeer.close();
		}

		let peer: ProtoPeer<PeerData>;

		// Create a new protoo Peer with the given peerId.
		try {
			peer = this._protoRoom.createPeer(peerId, socket);
		} catch (error) {
			log.error('protooRoom.createPeer() failed:%o', error);
			return null;
		}

		// Notify mediasoup version to the peer.
		peer.notify('mediasoup-version', { version: mediasoup.version });

		// Use the peer.data object to store mediasoup related objects.

		// Not joined after a custom protoo 'join' request is later received.
		peer.data.consume = consume;
		peer.data.joined = false;
		peer.data.displayName = undefined;
		peer.data.device = undefined;
		peer.data.rtpCapabilities = undefined;
		peer.data.sctpCapabilities = undefined;

		// Have mediasoup related maps ready even before the Peer joins since we
		// allow creating Transports before joining.
		peer.data.transports = new Map();
		peer.data.producers = new Map();
		peer.data.consumers = new Map();
		peer.data.dataProducers = new Map();
		peer.data.dataConsumers = new Map();

		peer.once('close', () => {
			if (this._closed) return;

			log.info('protoo Peer "close" event [peerId:%s]', peer.id);

			// If the Peer was joined, notify all Peers.
			if (peer.data.joined) {
				for (const otherPeer of this._getJoinedPeers({ excludePeer: peer })) {
					otherPeer.notify('peerClosed', { peerId: peer.id });
				}
			}

			// Iterate and close all mediasoup Transport associated to this Peer, so all
			// its Producers and Consumers will also be closed.
			for (const transport of peer.data.transports.values()) {
				transport.close();
			}
		});

		return peer;
	}

	getRouterRtpCapabilities() {
		return this._mediasoupRouter.rtpCapabilities;
	}

	/**
	 * Create a Broadcaster. This is for HTTP API requests (see server.js).
	 */
	async createBroadcaster({ id, displayName, device = {}, rtpCapabilities }: CreateBroadcaster) {
		if (typeof id !== 'string' || !id) throw new TypeError('missing body.id');
		else if (typeof displayName !== 'string' || !displayName)
			throw new TypeError('missing body.displayName');
		else if (typeof device.name !== 'string' || !device.name)
			throw new TypeError('missing body.device.name');
		else if (rtpCapabilities && typeof rtpCapabilities !== 'object')
			throw new TypeError('wrong body.rtpCapabilities');

		if (this._broadcasters.has(id)) throw new Error(`broadcaster with id "${id}" already exists`);

		const broadcaster: Broadcaster = {
			id,
			data: {
				room: this,
				joined: true,
				displayName,
				device: {
					flag: 'broadcaster',
					name: device.name || 'Unknown device',
					version: device.version,
				},
				rtpCapabilities,
				transports: new Map(),
				producers: new Map(),
				consumers: new Map(),
				dataProducers: new Map(),
				dataConsumers: new Map(),
			},
		};

		// Store the Broadcaster into the map.
		this._broadcasters.set(broadcaster.id, broadcaster);

		// Notify the new Broadcaster to all Peers.
		for (const otherPeer of this._getJoinedPeers()) {
			otherPeer.notify('newPeer', {
				id: broadcaster.id,
				displayName: broadcaster.data.displayName,
				device: broadcaster.data.device,
			});
		}

		// Reply with the list of Peers and their Producers.
		const peerInfos: PeerInfo[] = [];
		const joinedPeers = this._getJoinedPeers();

		// Just fill the list of Peers if the Broadcaster provided its rtpCapabilities.
		if (rtpCapabilities) {
			for (const joinedPeer of joinedPeers) {
				const peerInfo: PeerInfo = {
					id: joinedPeer.id,
					displayName: joinedPeer.data.displayName,
					device: joinedPeer.data.device,
					producers: [],
				};

				for (const producer of joinedPeer.data.producers.values()) {
					// Ignore Producers that the Broadcaster cannot consume.
					if (
						!this._mediasoupRouter.canConsume({
							producerId: producer.id,
							rtpCapabilities,
						})
					) {
						continue;
					}

					peerInfo.producers.push({
						id: producer.id,
						kind: producer.kind,
					});
				}

				peerInfos.push(peerInfo);
			}
		}

		return { peers: peerInfos };
	}

	/**
	 * Delete a Broadcaster.
	 */
	deleteBroadcaster({ broadcasterId }: { broadcasterId: string }) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		for (const transport of broadcaster.data.transports.values()) {
			transport.close();
		}

		this._broadcasters.delete(broadcasterId);

		for (const peer of this._getJoinedPeers()) {
			peer.notify('peerClosed', { peerId: broadcasterId });
		}
	}

	/**
	 * Create a mediasoup Transport associated to a Broadcaster. It can be a
	 * PlainTransport or a WebRtcTransport.
	 */
	async createBroadcasterTransport({
		broadcasterId,
		type,
		rtcpMux = false,
		comedia = true,
		sctpCapabilities,
	}: CreateBroadcasterTransport) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		switch (type) {
			case 'webrtc': {
				const webRtcTransportOptions: mediasoup.types.WebRtcTransportOptions = {
					...(deepClone(config.mediasoup.webRtcTransportOptions) as any),
					webRtcServer: this._webRtcServer,
					iceConsentTimeout: 20,
					enableSctp: Boolean(sctpCapabilities),
					numSctpStreams: (sctpCapabilities || {}).numStreams,
				};

				const transport = await this._mediasoupRouter.createWebRtcTransport(webRtcTransportOptions);

				// Store it.
				broadcaster.data.transports.set(transport.id, transport);

				return {
					id: transport.id,
					iceParameters: transport.iceParameters,
					iceCandidates: transport.iceCandidates,
					dtlsParameters: transport.dtlsParameters,
					sctpParameters: transport.sctpParameters,
				};
			}

			case 'plain': {
				const plainTransportOptions: mediasoup.types.PlainTransportOptions = {
					...deepClone(config.mediasoup.plainTransportOptions),
					rtcpMux: rtcpMux,
					comedia: comedia,
				};

				const transport = await this._mediasoupRouter.createPlainTransport(plainTransportOptions);

				// Store it.
				broadcaster.data.transports.set(transport.id, transport);

				return {
					id: transport.id,
					ip: transport.tuple.localIp,
					port: transport.tuple.localPort,
					rtcpPort: transport.rtcpTuple ? transport.rtcpTuple.localPort : undefined,
				};
			}

			default: {
				throw new TypeError('invalid type');
			}
		}
	}

	/**
	 * Connect a Broadcaster mediasoup WebRtcTransport.
	 */
	async connectBroadcasterTransport({
		broadcasterId,
		transportId,
		dtlsParameters,
	}: ConnectBroadcasterTransport) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		const transport = broadcaster.data.transports.get(transportId);

		if (!transport) throw new Error(`transport with id "${transportId}" does not exist`);

		if (transport.constructor.name !== 'WebRtcTransport') {
			throw new Error(`transport with id "${transportId}" is not a WebRtcTransport`);
		}

		await transport.connect({ dtlsParameters });
	}

	/**
	 * Create a mediasoup Producer associated to a Broadcaster.
	 */
	async createBroadcasterProducer({
		broadcasterId,
		transportId,
		kind,
		rtpParameters,
	}: CreateBroadcasterProducer) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		const transport = broadcaster.data.transports.get(transportId);

		if (!transport) throw new Error(`transport with id "${transportId}" does not exist`);

		const producer = await transport.produce({ kind, rtpParameters });

		// Store it.
		broadcaster.data.producers.set(producer.id, producer);

		// Set Producer events.
		// producer.on('score', (score) =>
		// {
		// 	logger.debug(
		// 		'broadcaster producer "score" event [producerId:%s, score:%o]',
		// 		producer.id, score);
		// });

		producer.on('videoorientationchange', (videoOrientation) => {
			log.debug(
				'broadcaster producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]',
				producer.id,
				videoOrientation,
			);
		});

		// Optimization: Create a server-side Consumer for each Peer.
		for (const peer of this._getJoinedPeers()) {
			this._createConsumer({
				consumerPeer: peer,
				producerPeer: broadcaster,
				producer,
			});
		}

		// Add into the AudioLevelObserver and ActiveSpeakerObserver.
		if (producer.kind === 'audio') {
			this._audioLevelObserver.addProducer({ producerId: producer.id }).catch(() => {});

			this._activeSpeakerObserver.addProducer({ producerId: producer.id }).catch(() => {});
		}

		return { id: producer.id };
	}

	/**
	 * Create a mediasoup Consumer associated to a Broadcaster.
	 */
	async createBroadcasterConsumer({
		broadcasterId,
		transportId,
		producerId,
	}: CreateBroadcasterConsumer) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		if (!broadcaster.data.rtpCapabilities)
			throw new Error('broadcaster does not have rtpCapabilities');

		const transport = broadcaster.data.transports.get(transportId);

		if (!transport) throw new Error(`transport with id "${transportId}" does not exist`);

		const consumer = await transport.consume({
			producerId,
			rtpCapabilities: broadcaster.data.rtpCapabilities,
		});

		// Store it.
		broadcaster.data.consumers.set(consumer.id, consumer);

		// Set Consumer events.
		consumer.on('transportclose', () => {
			// Remove from its map.
			broadcaster.data.consumers.delete(consumer.id);
		});

		consumer.on('producerclose', () => {
			// Remove from its map.
			broadcaster.data.consumers.delete(consumer.id);
		});

		return {
			id: consumer.id,
			producerId,
			kind: consumer.kind,
			rtpParameters: consumer.rtpParameters,
			type: consumer.type,
		};
	}

	/**
	 * Create a mediasoup DataConsumer associated to a Broadcaster.
	 */
	async createBroadcasterDataConsumer({
		broadcasterId,
		transportId,
		dataProducerId,
	}: CreateBroadcasterDataConsumer) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		if (!broadcaster.data.rtpCapabilities)
			throw new Error('broadcaster does not have rtpCapabilities');

		const transport = broadcaster.data.transports.get(transportId);

		if (!transport) throw new Error(`transport with id "${transportId}" does not exist`);

		const dataConsumer = await transport.consumeData({
			dataProducerId,
		});

		// Store it.
		broadcaster.data.dataConsumers.set(dataConsumer.id, dataConsumer);

		// Set Consumer events.
		dataConsumer.on('transportclose', () => {
			// Remove from its map.
			broadcaster.data.dataConsumers.delete(dataConsumer.id);
		});

		dataConsumer.on('dataproducerclose', () => {
			// Remove from its map.
			broadcaster.data.dataConsumers.delete(dataConsumer.id);
		});

		return {
			id: dataConsumer.id,
			streamId: dataConsumer.sctpStreamParameters!.streamId,
		};
	}

	/**
	 * Create a mediasoup DataProducer associated to a Broadcaster.
	 *
	 * @async
	 *
	 * @type {String} broadcasterId
	 * @type {String} transportId
	 */
	async createBroadcasterDataProducer({
		broadcasterId,
		transportId,
		label,
		protocol,
		sctpStreamParameters,
		appData,
	}: CreateBroadcasterDataProducer) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster) throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		// if (!broadcaster.data.sctpCapabilities)
		// 	throw new Error('broadcaster does not have sctpCapabilities');

		const transport = broadcaster.data.transports.get(transportId);

		if (!transport) throw new Error(`transport with id "${transportId}" does not exist`);

		const dataProducer = await transport.produceData({
			sctpStreamParameters,
			label,
			protocol,
			appData,
		});

		// Store it.
		broadcaster.data.dataProducers.set(dataProducer.id, dataProducer);

		// Set Consumer events.
		dataProducer.on('transportclose', () => {
			// Remove from its map.
			broadcaster.data.dataProducers.delete(dataProducer.id);
		});

		// Optimization: Create a server-side Consumer for each Peer.
		for (const peer of this._getJoinedPeers()) {
			this._createDataConsumer({
				dataConsumerPeer: peer,
				dataProducerPeer: broadcaster,
				dataProducer: dataProducer,
			});
		}

		return {
			id: dataProducer.id,
		};
	}

	_handleAudioLevelObserver() {
		this._audioLevelObserver.on('volumes', (volumes) => {
			const { producer, volume } = volumes[0];

			log.debug(
				'audioLevelObserver "volumes" event [producerId:%s, volume:%s]',
				producer.id,
				volume,
			);

			// Notify all Peers.
			for (const peer of this._getJoinedPeers()) {
				peer.notify('activeSpeaker', {
					peerId: producer.appData.peerId,
					volume: volume,
				});
			}
		});

		this._audioLevelObserver.on('silence', () => {
			log.debug('audioLevelObserver "silence" event');

			// Notify all Peers.
			for (const peer of this._getJoinedPeers()) {
				peer.notify('activeSpeaker', { peerId: null });
			}
		});
	}

	_handleActiveSpeakerObserver() {
		this._activeSpeakerObserver.on('dominantspeaker', (dominantSpeaker) => {
			log.debug(
				'activeSpeakerObserver "dominantspeaker" event [producerId:%s]',
				dominantSpeaker.producer.id,
			);
		});
	}

	get audioLevelObserver() {
		return this._audioLevelObserver;
	}

	get activeSpeakerObserver() {
		return this._activeSpeakerObserver;
	}

	get webRtcServer() {
		return this._webRtcServer;
	}

	get bot(): Readonly<Bot> {
		return this._bot;
	}

	get broadcasters(): Broadcaster[] {
		return Array.from(this._broadcasters.values());
	}

	async resetNetworkThrottle() {
		try {
			// await throttle.stop({});
			log.warn('network throttle stopped');
		} catch (err) {
			const error = toError(err);
			log.error('network throttle stop failed: %o', error);
			throw error;
		}
	}

	applyNetworkThrottle(params: any) {
		const DefaultUplink = 1000000;
		const DefaultDownlink = 1000000;
		const DefaultRtt = 0;
		const DefaultPacketLoss = 0;

		const { uplink, downlink, rtt, packetLoss } = params;

		try {
			this._networkThrottled = true;

			// await throttle.start({
			// 	up: uplink || DefaultUplink,
			// 	down: downlink || DefaultDownlink,
			// 	rtt: rtt || DefaultRtt,
			// 	packetLoss: packetLoss || DefaultPacketLoss,
			// });

			log.warn(
				'network throttle set [uplink:%s, downlink:%s, rtt:%s, packetLoss:%s]',
				uplink || DefaultUplink,
				downlink || DefaultDownlink,
				rtt || DefaultRtt,
				packetLoss || DefaultPacketLoss,
			);
		} catch (err) {
			const error = toError(err);
			log.error('network throttle apply failed: %o', error);
			throw error;
		}
	}

	createWebRtcTransport(
		options: mediasoup.types.WebRtcTransportOptions,
	): Promise<mediasoup.types.WebRtcTransport> {
		return this._mediasoupRouter.createWebRtcTransport(options);
	}

	/**
	 * Helper to get the list of joined protoo peers.
	 */
	_getJoinedPeers({
		excludePeer = undefined,
	}: { excludePeer?: ProtoPeer<any> } = {}): ProtoPeer<PeerData>[] {
		return this._protoRoom.peers.filter((peer) => peer.data.joined && peer !== excludePeer);
	}

	/**
	 * Creates a mediasoup Consumer for the given mediasoup Producer.
	 *
	 * @async
	 */
	async _createConsumer({ consumerPeer, producerPeer, producer }: CreateConsumer) {
		// Optimization:
		// - Create the server-side Consumer in paused mode.
		// - Tell its Peer about it and wait for its response.
		// - Upon receipt of the response, resume the server-side Consumer.
		// - If video, this will mean a single key frame requested by the
		//   server-side Consumer (when resuming it).
		// - If audio (or video), it will avoid that RTP packets are received by the
		//   remote endpoint *before* the Consumer is locally created in the endpoint
		//   (and before the local SDP O/A procedure ends). If that happens (RTP
		//   packets are received before the SDP O/A is done) the PeerConnection may
		//   fail to associate the RTP stream.

		// NOTE: Don't create the Consumer if the remote Peer cannot consume it.
		if (
			!consumerPeer.data.rtpCapabilities ||
			!this._mediasoupRouter.canConsume({
				producerId: producer.id,
				rtpCapabilities: consumerPeer.data.rtpCapabilities,
			})
		) {
			return;
		}

		// Must take the Transport the remote Peer is using for consuming.
		const transport = Array.from(consumerPeer.data.transports.values()).find(
			(t) => t.appData.consuming,
		);

		// This should not happen.
		if (!transport) {
			log.warn('_createConsumer() | Transport for consuming not found');

			return;
		}

		const promises = [];

		const consumerCount = 1 + this._consumerReplicas;

		for (let i = 0; i < consumerCount; i++) {
			promises.push(
				// eslint-disable-next-line no-async-promise-executor
				new Promise<void>(async (resolve) => {
					// Create the Consumer in paused mode.
					let consumer;

					try {
						consumer = await transport.consume({
							producerId: producer.id,
							rtpCapabilities: consumerPeer.data.rtpCapabilities!,
							// Enable NACK for OPUS.
							enableRtx: true,
							paused: true,
							ignoreDtx: true,
						});
					} catch (error) {
						log.warn('_createConsumer() | transport.consume():%o', error);

						resolve();

						return;
					}

					// Store the Consumer into the protoo consumerPeer data Object.
					consumerPeer.data.consumers.set(consumer.id, consumer);

					// Set Consumer events.
					consumer.on('transportclose', () => {
						// Remove from its map.
						consumerPeer.data.consumers.delete(consumer.id);
					});

					consumer.on('producerclose', () => {
						// Remove from its map.
						consumerPeer.data.consumers.delete(consumer.id);

						consumerPeer.notify('consumerClosed', { consumerId: consumer.id });
					});

					consumer.on('producerpause', () => {
						consumerPeer.notify('consumerPaused', { consumerId: consumer.id });
					});

					consumer.on('producerresume', () => {
						consumerPeer.notify('consumerResumed', { consumerId: consumer.id });
					});

					consumer.on('score', (score) => {
						consumerPeer.notify('consumerScore', { consumerId: consumer.id, score });
					});

					consumer.on('layerschange', (layers) => {
						consumerPeer.notify('consumerLayersChanged', {
							consumerId: consumer.id,
							spatialLayer: layers ? layers.spatialLayer : null,
							temporalLayer: layers ? layers.temporalLayer : null,
						});
					});

					consumer.on('trace', (trace) => {
						log.debug(
							'consumer "trace" event [producerId:%s, trace.type:%s, trace:%o]',
							consumer.id,
							trace.type,
							trace,
						);
					});

					// Send a protoo request to the remote Peer with Consumer parameters.
					try {
						await consumerPeer.call('newConsumer', {
							peerId: producerPeer.id,
							producerId: producer.id,
							id: consumer.id,
							kind: consumer.kind,
							rtpParameters: consumer.rtpParameters,
							type: consumer.type,
							appData: producer.appData,
							producerPaused: consumer.producerPaused,
						});

						// Now that we got the positive response from the remote endpoint, resume
						// the Consumer so the remote endpoint will receive the a first RTP packet
						// of this new stream once its PeerConnection is already ready to process
						// and associate it.
						await consumer.resume();

						consumerPeer.notify('consumerScore', {
							consumerId: consumer.id,
							score: consumer.score,
						});

						resolve();
					} catch (error) {
						log.warn('_createConsumer() | failed:%o', error);

						resolve();
					}
				}),
			);
		}

		try {
			await Promise.all(promises);
		} catch (error) {
			log.warn('_createConsumer() | failed:%o', error);
		}
	}

	/**
	 * Creates a mediasoup DataConsumer for the given mediasoup DataProducer.
	 *
	 * @async
	 */
	async _createDataConsumer({
		dataConsumerPeer,
		dataProducerPeer = null, // This is null for the bot DataProducer.
		dataProducer,
	}: CreateDataConsumer) {
		// NOTE: Don't create the DataConsumer if the remote Peer cannot consume it.
		if (!dataConsumerPeer.data.sctpCapabilities) return;

		// Must take the Transport the remote Peer is using for consuming.
		const transport = Array.from(dataConsumerPeer.data.transports.values()).find(
			(t) => t.appData.consuming,
		);

		// This should not happen.
		if (!transport) {
			log.warn('_createDataConsumer() | Transport for consuming not found');

			return;
		}

		// Create the DataConsumer.
		let dataConsumer: mediasoup.types.DataConsumer;

		try {
			dataConsumer = await transport.consumeData({
				dataProducerId: dataProducer.id,
			});
		} catch (error) {
			log.warn('_createDataConsumer() | transport.consumeData():%o', error);

			return;
		}

		// Store the DataConsumer into the protoo dataConsumerPeer data Object.
		dataConsumerPeer.data.dataConsumers.set(dataConsumer.id, dataConsumer);

		// Set DataConsumer events.
		dataConsumer.on('transportclose', () => {
			// Remove from its map.
			dataConsumerPeer.data.dataConsumers.delete(dataConsumer.id);
		});

		dataConsumer.on('dataproducerclose', () => {
			// Remove from its map.
			dataConsumerPeer.data.dataConsumers.delete(dataConsumer.id);
			dataConsumerPeer.notify('dataConsumerClosed', { dataConsumerId: dataConsumer.id });
		});

		// Send a protoo request to the remote Peer with Consumer parameters.
		try {
			await dataConsumerPeer.call('newDataConsumer', {
				// This is null for bot DataProducer.
				peerId: dataProducerPeer ? dataProducerPeer.id : null,
				dataProducerId: dataProducer.id,
				id: dataConsumer.id,
				sctpStreamParameters: dataConsumer.sctpStreamParameters,
				label: dataConsumer.label,
				protocol: dataConsumer.protocol,
				appData: dataProducer.appData,
			});
		} catch (error) {
			log.warn('_createDataConsumer() | failed', error);
		}
	}
}
