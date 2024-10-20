import { defineHandler } from './utils';

export default defineHandler(function ({ peer, room }, request) {
	// Ensure the Peer is not already joined.
	if (peer.data.joined) throw new Error('Peer already joined');

	const { displayName, device, rtpCapabilities, sctpCapabilities } = request;

	// Store client data into the proto Peer data object.
	peer.data.joined = true;
	peer.data.displayName = displayName;
	peer.data.device = device;
	peer.data.rtpCapabilities = rtpCapabilities;
	peer.data.sctpCapabilities = sctpCapabilities;

	// Tell the new Peer about already joined Peers.
	// And also create Consumers for existing Producers.

	const joinedPeers = [...room._getJoinedPeers(), ...room.broadcasters];

	// Reply now the request with the list of joined peers (all but the new one).
	const peerInfos = joinedPeers
		.filter((joinedPeer) => joinedPeer.id !== peer.id)
		.map((joinedPeer) => ({
			id: joinedPeer.id,
			displayName: joinedPeer.data.displayName,
			device: joinedPeer.data.device,
		}));

	// Mark the new Peer as joined.
	peer.data.joined = true;

	for (const joinedPeer of joinedPeers) {
		// Create Consumers for existing Producers.
		for (const producer of joinedPeer.data.producers.values()) {
			room._createConsumer({
				consumerPeer: peer,
				producerPeer: joinedPeer,
				producer,
			});
		}

		// Create DataConsumers for existing DataProducers.
		for (const dataProducer of joinedPeer.data.dataProducers.values()) {
			if (dataProducer.label === 'bot') continue;

			room._createDataConsumer({
				dataConsumerPeer: peer,
				dataProducerPeer: joinedPeer,
				dataProducer,
			});
		}
	}

	// Create DataConsumers for bot DataProducer.
	room._createDataConsumer({
		dataConsumerPeer: peer,
		dataProducerPeer: null,
		dataProducer: room.bot.dataProducer,
	});

	// Notify the new Peer to all other Peers.
	for (const otherPeer of room._getJoinedPeers({ excludePeer: peer })) {
		otherPeer.notify('newPeer', {
			id: peer.id,
			displayName: peer.data.displayName,
			device: peer.data.device,
		});
	}

	return { peers: peerInfos };
});
