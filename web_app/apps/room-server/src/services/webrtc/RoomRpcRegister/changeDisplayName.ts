import { defineHandler } from './utils';

export default defineHandler(function ({ peer, room }, request) {
	// Ensure the Peer is joined.
	if (!peer.data.joined) throw new Error('Peer not yet joined');

	const { displayName } = request;
	const oldDisplayName = peer.data.displayName;

	// Store the display name into the custom data Object of the protoo
	// Peer.
	peer.data.displayName = displayName;

	// Notify other joined Peers.
	for (const otherPeer of room._getJoinedPeers({ excludePeer: peer })) {
		otherPeer.notify('peerDisplayNameChanged', {
			peerId: peer.id,
			displayName,
			oldDisplayName,
		});
	}

	return true;
});
