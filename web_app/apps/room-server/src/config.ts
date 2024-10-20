import type mediasoup from 'mediasoup';

import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { env } from '@cultura-ai/shared';

const APP_ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const MEDIASOUP_CERT_FULLCHAIN = path.resolve(
	APP_ROOT,
	env.string('MEDIASOUP_CERT_FULLCHAIN', 'certs/mediasoup/fullchain.pem'),
);

const MEDIASOUP_CERT_PRIVKEY = path.resolve(
	APP_ROOT,
	env.string('MEDIASOUP_CERT_PRIVKEY', 'certs/mediasoup/privkey.pem'),
);

const MEDIASOUP_LISTEN_IP = env.string('MEDIASOUP_LISTEN_IP', '0.0.0.0');
44444;
const MEDIASOUP_WEBRTC_PORT = env.int('MEDIASOUP_WEBRTC_PORT', 44444);

const MEDIASOUP_ANNOUNCED_IP = env.string('MEDIASOUP_ANNOUNCED_IP', '127.0.0.1');

const MEDIASOUP_MIN_PORT = env.int('MEDIASOUP_MIN_PORT', 40000);
const MEDIASOUP_MAX_PORT = env.int('MEDIASOUP_MAX_PORT', 49999);

export default {
	// Listening hostname (just for `gulp live` task).
	domain: env.string('DOMAIN', 'localhost'),
	// Signaling settings (protoo WebSocket server and HTTP API server).
	ws: {
		host: env.string('WS_HOST', 'localhost'),
		port: env.int('WS_PORT', 3000),
		tls: {
			cert: path.resolve(APP_ROOT, env.string('WS_CERT_FULLCHAIN', 'certs/ws/fullchain.pem')),
			key: path.resolve(APP_ROOT, env.string('WS_CERT_PRIVKEY', 'certs/ws/privkey.pem')),
		},
	},
	// mediasoup settings.
	mediasoup: {
		useWebrtcServer: env.bool('MEDIASOUP_USE_WEBRTC_SERVER', true),
		// Number of mediasoup workers to launch.
		numWorkers: env.int('MEDIASOUP_WORKERS', Object.keys(os.cpus()).length),
		// mediasoup WorkerSettings.
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#WorkerSettings
		workerSettings: {
			// dtlsCertificateFile: MEDIASOUP_CERT_FULLCHAIN,
			// dtlsPrivateKeyFile: MEDIASOUP_CERT_PRIVKEY,
			logLevel: 'warn',
			logTags: [
				'info',
				'ice',
				'dtls',
				'rtp',
				'srtp',
				'rtcp',
				'rtx',
				'bwe',
				'score',
				'simulcast',
				'svc',
				'sctp',
			],
			disableLiburing: false,
		} as mediasoup.types.WorkerSettings,
		// mediasoup Router options.
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#RouterOptions
		routerOptions: {
			mediaCodecs: [
				{
					kind: 'audio',
					mimeType: 'audio/opus',
					clockRate: 48000,
					channels: 2,
				},
				{
					kind: 'video',
					mimeType: 'video/VP8',
					clockRate: 90000,
					parameters: {
						'x-google-start-bitrate': 1000,
					},
				},
				// {
				// 	kind: 'audio',
				// 	mimeType: 'audio/opus',
				// 	clockRate: 48000,
				// 	channels: 2,
				// },
				// {
				// 	kind: 'video',
				// 	mimeType: 'video/VP8',
				// 	clockRate: 90000,
				// 	parameters: {
				// 		'x-google-start-bitrate': 1000,
				// 	},
				// },
				// {
				// 	kind: 'video',
				// 	mimeType: 'video/VP9',
				// 	clockRate: 90000,
				// 	parameters: {
				// 		'profile-id': 2,
				// 		'x-google-start-bitrate': 1000,
				// 	},
				// },
				// {
				// 	kind: 'video',
				// 	mimeType: 'video/h264',
				// 	clockRate: 90000,
				// 	parameters: {
				// 		'packetization-mode': 1,
				// 		'profile-level-id': '4d0032',
				// 		'level-asymmetry-allowed': 1,
				// 		'x-google-start-bitrate': 1000,
				// 	},
				// },
				// {
				// 	kind: 'video',
				// 	mimeType: 'video/h264',
				// 	clockRate: 90000,
				// 	parameters: {
				// 		'packetization-mode': 1,
				// 		'profile-level-id': '42e01f',
				// 		'level-asymmetry-allowed': 1,
				// 		'x-google-start-bitrate': 1000,
				// 	},
				// },
			],
		} as mediasoup.types.RouterOptions,
		// mediasoup WebRtcServer options for WebRTC endpoints (mediasoup-client,
		// libmediasoupclient).
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcServerOptions
		// NOTE: mediasoup-demo/server/lib/Room.js will increase this port for
		// each mediasoup Worker since each Worker is a separate process.
		webRtcServerOptions: {
			listenInfos: [
				{
					protocol: 'udp',
					ip: MEDIASOUP_LISTEN_IP,
					announcedAddress: MEDIASOUP_ANNOUNCED_IP,
					port: MEDIASOUP_WEBRTC_PORT,
				},
				{
					protocol: 'tcp',
					ip: MEDIASOUP_LISTEN_IP,
					announcedAddress: MEDIASOUP_ANNOUNCED_IP,
					port: MEDIASOUP_WEBRTC_PORT,
				},
			],
		} as mediasoup.types.WebRtcServerOptions,
		// mediasoup WebRtcTransport options for WebRTC endpoints (mediasoup-client,
		// libmediasoupclient).
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
		webRtcTransportOptions: {
			// listenInfos is not needed since webRtcServer is used.
			// However passing MEDIASOUP_USE_WEBRTC_SERVER=false will change it.
			listenInfos: [
				{
					protocol: 'udp',
					ip: MEDIASOUP_LISTEN_IP,
					announcedAddress: MEDIASOUP_ANNOUNCED_IP,
					portRange: {
						min: MEDIASOUP_MIN_PORT,
						max: MEDIASOUP_MAX_PORT,
					},
				},
				{
					protocol: 'tcp',
					ip: MEDIASOUP_LISTEN_IP,
					announcedAddress: MEDIASOUP_ANNOUNCED_IP,
					portRange: {
						min: MEDIASOUP_MIN_PORT,
						max: MEDIASOUP_MAX_PORT,
					},
				},
			],
			initialAvailableOutgoingBitrate: 1000000,
			minimumAvailableOutgoingBitrate: 600000,
			maxSctpMessageSize: 262144,
			// Additional options that are not part of WebRtcTransportOptions.
			maxIncomingBitrate: 1500000,
		} as mediasoup.types.WebRtcTransportOptions,
		// mediasoup PlainTransport options for legacy RTP endpoints (FFmpeg,
		// GStreamer).
		// See https://mediasoup.org/documentation/v3/mediasoup/api/#PlainTransportOptions
		plainTransportOptions: {
			listenInfo: {
				protocol: 'udp',
				ip: MEDIASOUP_LISTEN_IP,
				announcedAddress: MEDIASOUP_ANNOUNCED_IP,
				portRange: {
					min: MEDIASOUP_MIN_PORT,
					max: MEDIASOUP_MAX_PORT,
				},
			},
			maxSctpMessageSize: 262144,
		} as mediasoup.types.PlainTransportOptions,
	},
};
