<script lang="ts" setup>
import { ref } from 'vue';

import { useTrackPublication } from '../composables/useTrackPublication';
import type { TrackReferenceOrPlaceholder } from '../composables/useTracks';

const props = defineProps<{ track: TrackReferenceOrPlaceholder }>();

const audioEl = ref<HTMLAudioElement>();

useTrackPublication(() => props.track, audioEl);
</script>

<template>
	<audio ref="audioEl" />
</template>
