import type { FastifyInstance } from 'fastify';
import {
	AccessToken,
	type AccessTokenOptions,
	DataPacket_Kind,
	RoomServiceClient,
	type VideoGrant,
} from 'livekit-server-sdk';

import { catchError, env, randomString } from '@cultura-ai/shared';

const LIVEKIT_URL = env.string('LIVEKIT_URL', 'wss://192.168.0.247');
const LIVEKIT_HOST = env.string('LIVEKIT_HOST', 'http://localhost:7880');
const LIVEKIT_API_KEY = env.string('LIVEKIT_API_KEY', 'devkey');
const LIVEKIT_API_SECRET = env.string('LIVEKIT_API_SECRET', 'secret');

export default (fastify: FastifyInstance) => {
	fastify.route<{ Body: { participantName: string; roomId: string; lang?: string } }>({
		method: 'POST',
		url: '/room.getConnectionDetails',
		schema: {
			body: {
				type: 'object',
				required: ['participantName', 'roomId'],
				properties: {
					participantName: { type: 'string' },
					roomId: { type: 'string' },
					lang: { type: 'string' },
				},
			},
		},
		async handler(request, reply) {
			const { participantName, roomId, lang } = request.body;

			// Generate participant token
			const participantToken = await createParticipantToken(
				{
					identity: `${participantName}__${randomString(4)}`,
					name: participantName,
				},
				roomId,
				{
					lang: lang || '',
				},
			);

			const data = {
				serverUrl: LIVEKIT_URL,
				roomId,
				participantToken: participantToken,
				participantName,
			};

			reply.send({ data });
		},
	});

	fastify.route<{ Body: { text: string; roomId: string } }>({
		method: 'POST',
		url: '/room.sendMessage',
		schema: {
			body: {
				type: 'object',
				required: ['roomId', 'text'],
				properties: {
					roomId: { type: 'string' },
					text: { type: 'string' },
				},
			},
		},
		async handler(request, reply) {
			const { roomId, text } = request.body;
			const published = {
				roomId,
				textLength: text.length,
			};

			const client = new RoomServiceClient(LIVEKIT_HOST, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
			const encoder = new TextEncoder();

			const [err] = await catchError(() =>
				client.sendData(
					roomId,
					encoder.encode(
						JSON.stringify({
							cmd: 'chat_message',
							name: 'Assistance',
							pid: 'assistance',
							text,
						}),
					),
					DataPacket_Kind.RELIABLE,
					{},
				),
			);

			if (err) {
				reply.status(500).send({ error: true, message: 'internal error' });
			} else {
				reply.send({ data: 'ok', published });
			}
		},
	});
};

function createParticipantToken(
	userInfo: AccessTokenOptions,
	roomId: string,
	attributes?: Record<string, string>,
) {
	const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, userInfo);
	at.ttl = '5m';
	const grant: VideoGrant = {
		room: roomId,
		roomJoin: true,
		canPublish: true,
		canPublishData: true,
		canSubscribe: true,
	};
	at.addGrant(grant);

	if (attributes) {
		at.attributes = attributes;
	}

	return at.toJwt();
}
