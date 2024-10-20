<script lang="ts" setup>
import { ref } from 'vue';

import { useTrackPublication } from '../composables/useTrackPublication';
import type { TrackReferenceOrPlaceholder } from '../composables/useTracks';

const props = defineProps<{ track: TrackReferenceOrPlaceholder }>();

const videoEl = ref<HTMLVideoElement>();

useTrackPublication(() => props.track, videoEl);
</script>

<template>
	<video ref="videoEl" />
</template>
