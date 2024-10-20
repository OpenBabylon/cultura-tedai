import { defineHandler } from './utils';

export default defineHandler(async function ({ peer, room }, request) {
	// Ensure the Peer is joined.
	if (!peer.data.joined) throw new Error('Peer not yet joined');

	const { transportId, kind, rtpParameters } = request;
	let { appData } = request;
	const transport = peer.data.transports.get(transportId);

	// Add peerId into appData to later get the associated Peer during
	// the 'loudest' event of the audioLevelObserver.
	appData = { ...appData, peerId: peer.id };

	if (!transport) throw new Error(`transport with id "${transportId}" not found`);

	const producer = await transport.produce({
		kind,
		rtpParameters,
		appData,
		// keyFrameRequestDelay: 5000
	});

	// Store the Producer into the protoo Peer data Object.
	peer.data.producers.set(producer.id, producer);

	// Set Producer events.
	producer.on('score', (score) => {
		peer.notify('producerScore', { producerId: producer.id, score });
	});

	producer.on('videoorientationchange', (videoOrientation) => {
		this.log.info(
			'producer "videoorientationchange" event [producerId:%s, videoOrientation:%o]',
			producer.id,
			{ ...videoOrientation, kind },
		);
	});

	producer.on('trace', (trace) => {
		this.log.info(
			'producer "trace" event [producerId:%s, trace.type:%s, trace:%o]',
			producer.id,
			trace.type,
			trace,
		);
	});

	// Optimization: Create a server-side Consumer for each Peer.
	for (const otherPeer of room._getJoinedPeers({ excludePeer: peer })) {
		room._createConsumer({
			consumerPeer: otherPeer,
			producerPeer: peer,
			producer,
		});
	}

	// Add into the AudioLevelObserver and ActiveSpeakerObserver.
	if (producer.kind === 'audio') {
		room.audioLevelObserver.addProducer({ producerId: producer.id }).catch(() => {});
		room.activeSpeakerObserver.addProducer({ producerId: producer.id }).catch(() => {});
	}

	return { id: producer.id };
});
