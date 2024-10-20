<script lang="ts" setup>
import { useRoomContext } from '../composables/useRoomContext';
import { useRoomInfo } from '../composables/useRoomInfo';
import InRoom from './InRoom.vue';
import PreJoin from './PreJoin.vue';

const { joined } = useRoomContext();
const { name } = useRoomInfo();
</script>

<template>
	<Card
		class="min-w-96 relative overflow-hidden"
		:class="{ 'w-full h-full': joined }"
		:pt="
			!joined
				? undefined
				: {
						content: 'w-full h-full',
						body: 'w-full h-full',
					}
		"
	>
		<template #title v-if="!joined">{{ name }}</template>
		<template #content>
			<InRoom v-if="joined" />
			<PreJoin v-else />
		</template>
	</Card>
</template>
