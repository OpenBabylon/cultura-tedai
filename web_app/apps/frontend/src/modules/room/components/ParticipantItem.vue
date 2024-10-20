<script lang="ts" setup>
import { Participant, ParticipantEvent, Track } from 'livekit-client';

import { onParticipantEvent } from '../composables/onParticipantEvent';
import { useParticipant } from '../composables/useParticipant';
import { useRoomContext } from '../composables/useRoomContext';
import { useParticipantTrack } from '../composables/useTracks';
import { useTranscriptions } from '../composables/useTranscriptions';
import AudioTrack from './AudioTrack.vue';
import VideoTrack from './VideoTrack.vue';

const { room, transcriptionAvailable } = useRoomContext();
const props = defineProps<{ item: Participant; minimized?: boolean }>();
const participant = useParticipant(() => props.item);

const cameraTrack = useParticipantTrack(Track.Source.Camera, () => props.item.identity);

const microphoneTrack = useParticipantTrack(Track.Source.Microphone, () => props.item.identity);

const { transcriptions, isTranscriptionsEnabled, toggleTranscriptions } = useTranscriptions(
	() => props.item,
);

// const screenShareTrack = useParticipantTrack(Track.Source.ScreenShare, () => props.item.identity);

onParticipantEvent(
	() => props.item,
	ParticipantEvent.AttributesChanged,
	(attrs) => {
		isTranscriptionsEnabled.value = attrs.transcriptions === 'true';
	},
);
</script>

<template>
	<div class="rounded-md dark:bg-slate-800 overflow-hidden relative" section="participant-item">
		<div
			section="participant-name"
			class="py-1 px-3 absolute bg-surface-900 bg-opacity-80 left-2 top-2 text-xs rounded"
		>
			<span>{{ item.name }}</span>
			<span class="text-red-600" v-if="!participant.isMicrophoneEnabled.value">
				<li class="pi pi-microphone" />
			</span>
		</div>

		<div
			section="participant-controls"
			v-if="transcriptionAvailable"
			class="py-1 px-3 absolute right-2 top-2 z-10"
		>
			<Button
				icon="pi pi-align-right"
				rounded
				severity="contrast"
				:outlined="!isTranscriptionsEnabled"
				@click="toggleTranscriptions"
			/>
		</div>

		<div
			section="transcriptions"
			v-if="transcriptions"
			class="absolute z-10 bottom-20 left-[50%] max-w-[70%] bg-white text-black px-6 font-semibold py-4 rounded-lg -translate-x-1/2"
		>
			<div class="whitespace-pre-line">"{{ transcriptions }}"</div>
		</div>

		<VideoTrack v-if="cameraTrack" class="w-full h-full object-cover" :track="cameraTrack" />
		<AudioTrack v-if="microphoneTrack" :track="microphoneTrack" />
	</div>
</template>
