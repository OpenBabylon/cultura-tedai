<script lang="ts" setup>
import { RoomEvent, Track } from 'livekit-client';
import { computed } from 'vue';

import { onRoomEvent } from '../composables/onRoomEvent';
import { useConnectionState } from '../composables/useConnectionState';
import { useLocalParticipant } from '../composables/useLocalParticipant';
import { useRemoteParticipants } from '../composables/useRemoteParticipants';
import { useRoomContext } from '../composables/useRoomContext';
import { type TrackReference } from '../composables/useTracks';
import { useTranscriptions } from '../composables/useTranscriptions';
import Participants from './Participants.vue';
import SidebarAssistance from './SidebarAssistance.vue';
import VideoTrack from './VideoTrack.vue';

const { room, userChoices, leaderId, transcriptionAvailable } = useRoomContext();

const remoteParticipants = useRemoteParticipants();

const connectionState = useConnectionState();

const {
	cameraTrack: localCameraTrack,
	isCameraEnabled,
	isMicrophoneEnabled,
} = useLocalParticipant();

const { isTranscriptionsEnabled, toggleTranscriptions } = useTranscriptions(
	() => room.localParticipant,
);

const localCameraReference = computed<TrackReference | null>(() =>
	!localCameraTrack.value
		? null
		: {
				participant: room.localParticipant,
				publication: localCameraTrack.value,
				source: Track.Source.Camera,
			},
);

const setFirstParticipantLeader = () => {
	leaderId.value = Array.from(room.remoteParticipants.values())[0]?.identity ?? null;
	console.log('leaderId', leaderId.value);
};

const setMicrophoneEnabled = (flag: boolean) => {
	const localP = room.localParticipant;

	localP.setMicrophoneEnabled(!!flag, {
		deviceId: userChoices.audioDeviceId,
	});
};

const setCameraEnabled = (flag: boolean) => {
	const localP = room.localParticipant;

	localP.setCameraEnabled(!!flag, {
		deviceId: userChoices.videoDeviceId,
	});
};

onRoomEvent(RoomEvent.ParticipantDisconnected, (participant) => {
	if (leaderId.value === participant.identity) {
		setFirstParticipantLeader();
	}
});

onRoomEvent(RoomEvent.SignalConnected, () => {
	setFirstParticipantLeader();
	setMicrophoneEnabled(true);
	setCameraEnabled(true);
});
</script>

<template>
	<div
		class="w-full h-full relative flex gap-2"
		:class="{ 'p-4': remoteParticipants.length > 1 }"
		section="in-room"
	>
		<div class="flex-1 relative">
			<Participants />

			<div
				section="in-room-status"
				class="w-full py-4 px-3 text-sm absolute bottom-0 left-0 bg-gradient-to-t from-zinc-950"
			>
				Status: {{ connectionState }}
			</div>

			<div
				class="absolute bottom-2 z-10 left-0 w-full flex items-center justify-center gap-4"
				section="in-room-controls"
			>
				<Button
					icon="pi pi-camera"
					:outlined="!isCameraEnabled"
					rounded
					severity="contrast"
					@click="setCameraEnabled(!isCameraEnabled)"
				/>
				<Button
					icon="pi pi-microphone"
					:outlined="!isMicrophoneEnabled"
					rounded
					severity="contrast"
					@click="setMicrophoneEnabled(!isMicrophoneEnabled)"
				/>
				<Button
					v-if="transcriptionAvailable"
					icon="pi pi-align-right"
					rounded
					severity="contrast"
					:outlined="!isTranscriptionsEnabled"
					@click="toggleTranscriptions"
				/>
				<Button
					icon="pi pi-phone"
					class="bg-red-600"
					rounded
					severity="danger"
					as="router-link"
					to="/"
				/>
			</div>

			<div
				section="in-room-local-video"
				class="absolute bottom-2 right-4 overflow-hidden rounded w-[20dvw] h-[25dvh] min-w-28 min-h-20 max-h-52 max-w-52 shadow-lg"
				v-if="localCameraReference"
			>
				<VideoTrack class="w-full h-full object-cover" :track="localCameraReference" />
			</div>
		</div>

		<SidebarAssistance />
	</div>
</template>
