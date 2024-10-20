import { useIntervalFn } from '@vueuse/core';
import { Participant, ParticipantEvent, type TranscriptionSegment } from 'livekit-client';
import { type MaybeRefOrGetter, ref, toValue } from 'vue';

import { chunk } from '@cultura-ai/shared';

import { onParticipantEvent } from './onParticipantEvent';
import { onRoomDataCommand } from './onRoomDataCommand';
import { useRoomContext } from './useRoomContext';

export const useTranscriptions = (participant: MaybeRefOrGetter<Participant>) => {
	const { room, transcriptionAvailable } = useRoomContext();

	const transcriptions = ref<string | null>(null);
	const isTranscriptionsEnabled = ref(false);

	const maxSegments = 4;

	const encoder = new TextEncoder();

	let currentSegments: TranscriptionSegment[] = [];

	setTimeout(() => {
		console.log('Ask transcriptions');

		room.localParticipant
			.publishData(encoder.encode(JSON.stringify({ cmd: 'ask_transcriptions' })), {
				reliable: true,
			})
			.catch(console.error);
	}, 3000);

	onRoomDataCommand('transcriptions_list', (msg) => {
		transcriptionAvailable.value = true;
		isTranscriptionsEnabled.value = !!msg.value?.includes(toValue(participant).identity);

		if (!isTranscriptionsEnabled.value) {
			transcriptions.value = null;
			p.pause();
		} else {
			p.resume();
		}
	});

	const computeTranscriptions = () => {
		currentSegments = currentSegments.slice(Math.max(currentSegments.length - maxSegments, 0));

		transcriptions.value = chunk(currentSegments, 2)
			.map((v) =>
				v
					.map((v) => v.text)
					.join(' ')
					.trim(),
			)
			.filter(Boolean)
			.join('\n');
	};

	const noopTranscriptionSegment = {
		endTime: 0,
		final: false,
		firstReceivedTime: 0,
		id: '0',
		language: '',
		lastReceivedTime: 0,
		startTime: 0,
		text: '',
	};

	const p = useIntervalFn(() => {
		currentSegments.push(noopTranscriptionSegment);
		computeTranscriptions();
	}, 2500);

	onParticipantEvent(participant, ParticipantEvent.TranscriptionReceived, (segments) => {
		currentSegments.push(...segments);
		computeTranscriptions();
		p.pause();
		p.resume();
	});

	const toggleTranscriptions = async () => {
		const cmdName = isTranscriptionsEnabled.value ? 'unset_transcriptions' : 'set_transcriptions';

		await room.localParticipant.publishData(
			encoder.encode(
				JSON.stringify({
					cmd: cmdName,
					target: toValue(participant).identity,
				}),
			),
			{ reliable: true },
		);
	};

	return { transcriptions, isTranscriptionsEnabled, toggleTranscriptions };
};
