<script lang="ts" setup>
import type { LocalAudioTrack, LocalVideoTrack } from 'livekit-client';
import { type HTMLAttributes, computed, useAttrs, watch } from 'vue';

import type { SelectOptions } from '@cultura-ai/types';

import { useMediaDeviceSelect } from '../composables/useMediaDeviceSelect';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
	kind: MediaDeviceKind;
	track?: LocalAudioTrack | LocalVideoTrack;
	icon: string;
	class?: HTMLAttributes['class'];
}>();

const emit = defineEmits<{
	onActiveDeviceChange: [deviceId: string | undefined];
}>();

const attrs = useAttrs();

const { devices, deviceId } = useMediaDeviceSelect({
	kind: () => props.kind,
	track: () => props.track,
	requestPermissions: true,
});

watch(deviceId, (newDeviceId) => {
	emit('onActiveDeviceChange', newDeviceId);
});

const deviceOptions = computed<SelectOptions<string>>(() => {
	return devices.value.map((v) => ({
		text: v.label,
		value: v.deviceId,
	}));
});
</script>

<template>
	<InputGroup>
		<InputGroupAddon>
			<i :class="icon" />
		</InputGroupAddon>
		<Select
			v-model="deviceId"
			:options="deviceOptions"
			:class="class"
			option-label="text"
			option-value="value"
			v-bind="attrs"
			placeholder="Select Media"
		/>
	</InputGroup>
</template>
