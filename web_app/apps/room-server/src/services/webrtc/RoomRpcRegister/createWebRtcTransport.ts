import type * as mediasoup from 'mediasoup';

import { deepClone } from '@cultura-ai/shared';

import config from '@/config';

import { defineHandler } from './utils';

export default defineHandler(async function ({ peer, room }, request) {
	// NOTE: Don't require that the Peer is joined here, so the client can
	// initiate mediasoup Transports and be ready when he later joins.

	const { forceTcp, producing, consuming, sctpCapabilities } = request;

	const webRtcTransportOptions: mediasoup.types.WebRtcTransportOptions = {
		...(deepClone(config.mediasoup.webRtcTransportOptions) as any),
		webRtcServer: room.webRtcServer,
		iceConsentTimeout: 20,
		enableSctp: Boolean(sctpCapabilities),
		numSctpStreams: (sctpCapabilities || {}).numStreams,
		appData: { producing, consuming },
	};

	if (forceTcp) {
		webRtcTransportOptions.listenInfos = webRtcTransportOptions.listenInfos!.filter(
			(listenInfo) => listenInfo.protocol === 'tcp',
		);

		webRtcTransportOptions.enableUdp = false;
		webRtcTransportOptions.enableTcp = true;
	}

	const transport = await room.createWebRtcTransport(webRtcTransportOptions);

	transport.on('icestatechange', (iceState) => {
		this.log.info('WebRtcTransport "icestatechange" event [iceState:%s], closing peer', iceState);

		if (iceState === 'disconnected' || iceState === 'closed') {
			peer.close();
		}
	});

	transport.on('sctpstatechange', (sctpState) => {
		this.log.debug('WebRtcTransport "sctpstatechange" event [sctpState:%s]', sctpState);
	});

	transport.on('dtlsstatechange', (dtlsState) => {
		if (dtlsState === 'failed' || dtlsState === 'closed') {
			this.log.warn(
				'WebRtcTransport "dtlsstatechange" event [dtlsState:%s], closing peer',
				dtlsState,
			);

			peer.close();
		}
	});

	// NOTE: For testing.
	// await transport.enableTraceEvent([ 'probation', 'bwe' ]);
	await transport.enableTraceEvent(['bwe']);

	transport.on('trace', (trace) => {
		this.log.debug(
			'transport "trace" event [transportId:%s, trace.type:%s, trace:%o]',
			transport.id,
			trace.type,
			trace,
		);

		if (trace.type === 'bwe' && trace.direction === 'out') {
			peer.notify('downlinkBwe', {
				desiredBitrate: trace.info.desiredBitrate,
				effectiveDesiredBitrate: trace.info.effectiveDesiredBitrate,
				availableBitrate: trace.info.availableBitrate,
			});
		}
	});

	// Store the WebRtcTransport into the protoo Peer data Object.
	peer.data.transports.set(transport.id, transport);

	const { maxIncomingBitrate } = config.mediasoup.webRtcTransportOptions as {
		maxIncomingBitrate?: number;
	};

	// If set, apply max incoming bitrate limit.
	if (maxIncomingBitrate) {
		try {
			await transport.setMaxIncomingBitrate(maxIncomingBitrate);
		} catch (error) {}
	}

	return {
		id: transport.id,
		iceParameters: transport.iceParameters,
		iceCandidates: transport.iceCandidates,
		dtlsParameters: transport.dtlsParameters,
		sctpParameters: transport.sctpParameters,
	};
});
