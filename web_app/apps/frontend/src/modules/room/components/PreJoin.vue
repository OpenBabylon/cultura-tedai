<script lang="ts" setup>
import { LocalAudioTrack, LocalVideoTrack, Track } from 'livekit-client';
import { computed } from 'vue';

import type { SelectOptions } from '@cultura-ai/types';

import { usePreviewTracks } from '../composables/usePreviewTracks';
import { useRoomContext } from '../composables/useRoomContext';
import MediaDeviceSelect from './MediaDeviceSelect.vue';

const { join, userChoices } = useRoomContext();

const tracks = usePreviewTracks(() => ({
	audio: userChoices.audioEnabled ? { deviceId: userChoices.audioDeviceId } : false,
	video: userChoices.videoEnabled ? { deviceId: userChoices.videoDeviceId } : false,
}));

const audioTrack = computed(
	() => tracks.value.find((v) => v.kind === Track.Kind.Audio) as LocalAudioTrack | undefined,
);

const videoTrack = computed(
	() => tracks.value.find((v) => v.kind === Track.Kind.Video) as LocalVideoTrack | undefined,
);

const langOptions: SelectOptions<string> = [
	{ text: 'English', value: 'en' },
	{ text: 'Ukrainian', value: 'uk' },
	{ text: 'Russian', value: 'ru' },
];
</script>

<template>
	<div class="flex-auto">
		<label class="font-bold block mb-2">Name</label>
		<InputGroup>
			<InputGroupAddon>
				<i class="pi pi-user" />
			</InputGroupAddon>
			<InputText placeholder="Display Name" class="w-full" v-model="userChoices.username" />
		</InputGroup>
	</div>

	<div class="flex-auto pt-4">
		<label for="device-microphone" class="font-bold block mb-2">Microphone</label>
		<MediaDeviceSelect
			id="device-microphone"
			class="w-full"
			kind="audioinput"
			icon="pi pi-microphone"
			:track="audioTrack"
			@on-active-device-change="userChoices.audioDeviceId = $event ?? ''"
		/>
	</div>

	<div class="flex-auto pt-4">
		<label for="device-camera" class="font-bold block mb-2">Camera</label>

		<MediaDeviceSelect
			id="device-camera"
			class="w-full"
			kind="videoinput"
			icon="pi pi-camera"
			:track="videoTrack"
			@on-active-device-change="userChoices.videoDeviceId = $event ?? ''"
		/>
	</div>

	<div class="flex-auto pt-4">
		<label for="device-camera" class="font-bold block mb-2">Language</label>

		<InputGroup>
			<InputGroupAddon>
				<i class="pi pi-language" />
			</InputGroupAddon>
			<Select
				v-model="userChoices.lang"
				:options="langOptions"
				class="w-full"
				option-label="text"
				option-value="value"
				placeholder="Select Language"
			/>
		</InputGroup>
	</div>

	<div class="flex-auto pt-6">
		<Button class="w-full" severity="contrast" @click="join">Join Room</Button>
	</div>
</template>
