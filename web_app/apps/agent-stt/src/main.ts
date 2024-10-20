import {
	AutoSubscribe,
	type JobContext,
	WorkerOptions,
	WorkerPermissions,
	cli,
	defineAgent,
} from '@livekit/agents';

import { fileURLToPath } from 'node:url';

import { createLogger } from '@cultura-ai/logger';
import { catchError } from '@cultura-ai/shared';

import { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } from './config.js';
import { GroqTranscription } from './lib/groq.js';

const log = createLogger(import.meta);

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// await ServiceContainer.setup({
// 	pathRoot: __dirname,
// 	typeOutput: path.resolve(__dirname, '../ioc.d.ts'),
// 	generateTypes: env.isDevelopment,
// });

export default defineAgent({
	entry: async (ctx: JobContext) => {
		const encoder = new TextEncoder();
		const decoder = new TextDecoder();
		const transcriptionMap = new Map<string, GroqTranscription>();

		await ctx.connect(undefined, AutoSubscribe.AUDIO_ONLY);

		function publishTranscriptionsList() {
			ctx.room.localParticipant?.publishData(
				encoder.encode(
					JSON.stringify({
						cmd: 'transcriptions_list',
						value: Array.from(transcriptionMap.keys()),
					}),
				),
				{ reliable: true },
			);
		}

		ctx.addShutdownCallback(async () => {
			console.log('context shutdown?');

			for (const transcription of transcriptionMap.values()) {
				transcription.stop();
			}

			transcriptionMap.clear();
		});

		ctx.room.on('participantConnected', publishTranscriptionsList);
		ctx.room.on('trackPublished', publishTranscriptionsList);

		ctx.room.on('participantDisconnected', (participant) => {
			const transcription = transcriptionMap.get(participant.identity);

			if (transcription) {
				transcription.stop();
				transcriptionMap.delete(participant.identity);
			}
		});

		ctx.room.on('dataReceived', (payload, participant) => {
			if (!participant) return;

			const [_, message] = catchError(() => {
				const text = decoder.decode(payload);
				return JSON.parse(text) as Record<string, any>;
			});

			switch (message?.cmd) {
				case 'ask_transcriptions': {
					publishTranscriptionsList();
					break;
				}

				case 'set_transcriptions': {
					if (transcriptionMap.has(message.target)) {
						console.warn('ignore set_transcriptions already set');
						return;
					}

					const targetParticipant = ctx.room.remoteParticipants.get(message.target);

					if (!targetParticipant) {
						console.warn('ignore set_transcriptions target participant not exists.');
						return;
					}

					const transcription = new GroqTranscription();

					transcriptionMap.set(targetParticipant.identity, transcription);
					transcription.start(ctx.room, targetParticipant);
					publishTranscriptionsList();
					break;
				}

				case 'unset_transcriptions': {
					const transcription = transcriptionMap.get(message.target);

					if (!transcription) {
						console.warn('ignore unset_transcriptions already unset');
						return;
					}

					transcription.stop();
					transcriptionMap.delete(message.target);
					publishTranscriptionsList();

					break;
				}
			}
		});
	},
});

cli.runApp(
	new WorkerOptions({
		agent: fileURLToPath(import.meta.url),
		apiKey: LIVEKIT_API_KEY,
		apiSecret: LIVEKIT_API_SECRET,
		wsURL: LIVEKIT_URL,
		// BUG: can't connect when defined a name
		// agentName: 'agent-stt',
		permissions: new WorkerPermissions(true, true, true, true, undefined, true),
		async loadFunc() {
			return 0;
		},
		async requestFunc(job) {
			await job.accept();
		},
	}),
);
